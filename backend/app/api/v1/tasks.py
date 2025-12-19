"""
Task API routes.
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models import User, Task, TaskHistory
from app.schemas import (
    TaskCreate, TaskUpdate, TaskSchedule, TaskResponse, 
    TaskListResponse, DurationEstimateRequest, DurationEstimateResponse,
    ErrorResponse
)
from app.services.auth import get_current_user
from app.services.llm import estimate_duration_with_llm


router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_task(
    task_data: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a new task with automatic LLM duration estimation.
    """
    # Estimate duration using LLM
    description_for_estimate = f"{task_data.task_name}"
    if task_data.description:
        description_for_estimate += f" - {task_data.description}"
    
    estimate = await estimate_duration_with_llm(description_for_estimate)
    
    # Create task
    task = Task(
        user_id=current_user.id,
        task_name=task_data.task_name,
        description=task_data.description,
        estimated_duration=estimate.estimated_duration,
        manual_duration=task_data.manual_duration,
        category=task_data.category,
        priority=task_data.priority,
        due_date=task_data.due_date,
    )
    db.add(task)
    await db.flush()
    
    # Log history
    history = TaskHistory(
        task_id=task.id,
        action="created",
        changes={"task_name": task.task_name},
    )
    db.add(history)
    await db.refresh(task)
    
    return TaskResponse.model_validate(task)


@router.get(
    "",
    response_model=TaskListResponse,
)
async def list_tasks(
    due_date: Optional[datetime] = Query(None, description="Filter by due date"),
    is_scheduled: Optional[bool] = Query(None, description="Filter scheduled/unscheduled"),
    is_completed: Optional[bool] = Query(None, description="Filter completed/pending"),
    category: Optional[str] = Query(None, description="Filter by category"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List all tasks for the current user with optional filters.
    """
    query = select(Task).where(Task.user_id == current_user.id)
    
    # Apply filters
    if due_date is not None:
        query = query.where(Task.due_date == due_date.date())
    if is_scheduled is not None:
        query = query.where(Task.is_scheduled == is_scheduled)
    if is_completed is not None:
        query = query.where(Task.is_completed == is_completed)
    if category is not None:
        query = query.where(Task.category == category)
    
    # Order by due date, then created_at
    query = query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc())
    
    result = await db.execute(query)
    tasks = result.scalars().all()
    
    return TaskListResponse(
        tasks=[TaskResponse.model_validate(t) for t in tasks],
        total=len(tasks),
    )


@router.get(
    "/{task_id}",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
)
async def get_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get a specific task by ID.
    """
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    return TaskResponse.model_validate(task)


@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
)
async def update_task(
    task_id: uuid.UUID,
    task_data: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update a task's properties.
    """
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Track changes for history
    changes = {}
    update_data = task_data.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        if getattr(task, field) != value:
            changes[field] = {"old": getattr(task, field), "new": value}
            setattr(task, field, value)
    
    # Handle completion
    if task_data.is_completed is True and not task.completed_at:
        task.completed_at = datetime.utcnow()
        changes["completed_at"] = {"new": task.completed_at.isoformat()}
    elif task_data.is_completed is False:
        task.completed_at = None
    
    task.updated_at = datetime.utcnow()
    
    # Log history if there were changes
    if changes:
        history = TaskHistory(
            task_id=task.id,
            action="updated",
            changes=changes,
        )
        db.add(history)
    
    await db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={404: {"model": ErrorResponse}},
)
async def delete_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete a task.
    """
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    await db.delete(task)


@router.post(
    "/{task_id}/schedule",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
)
async def schedule_task(
    task_id: uuid.UUID,
    schedule_data: TaskSchedule,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Schedule a task to a specific time slot (drag-and-drop target).
    
    Sets is_scheduled=TRUE and populates scheduled_start_time.
    """
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Update scheduling
    old_time = task.scheduled_start_time
    task.is_scheduled = True
    task.scheduled_start_time = schedule_data.scheduled_start_time
    task.updated_at = datetime.utcnow()
    
    # Log history
    history = TaskHistory(
        task_id=task.id,
        action="scheduled",
        changes={
            "scheduled_start_time": schedule_data.scheduled_start_time.isoformat(),
            "previous_time": old_time.isoformat() if old_time else None,
        },
    )
    db.add(history)
    
    await db.refresh(task)
    return TaskResponse.model_validate(task)


@router.delete(
    "/{task_id}/schedule",
    response_model=TaskResponse,
    responses={404: {"model": ErrorResponse}},
)
async def unschedule_task(
    task_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Remove a task from the calendar (return to unscheduled).
    """
    result = await db.execute(
        select(Task).where(
            and_(Task.id == task_id, Task.user_id == current_user.id)
        )
    )
    task = result.scalar_one_or_none()
    
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )
    
    # Update scheduling
    old_time = task.scheduled_start_time
    task.is_scheduled = False
    task.scheduled_start_time = None
    task.updated_at = datetime.utcnow()
    
    # Log history
    history = TaskHistory(
        task_id=task.id,
        action="unscheduled",
        changes={
            "previous_time": old_time.isoformat() if old_time else None,
        },
    )
    db.add(history)
    
    await db.refresh(task)
    return TaskResponse.model_validate(task)


@router.post(
    "/estimate-duration",
    response_model=DurationEstimateResponse,
)
async def estimate_duration(
    request: DurationEstimateRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Get LLM-estimated duration for a task description.
    
    Can be called before creating a task to preview the estimate.
    """
    return await estimate_duration_with_llm(request.task_description)
