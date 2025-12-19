"""
Calendar API routes for external calendar integration.
"""
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models import User, CalendarConnection, ExternalEvent
from app.schemas import (
    ExternalEventResponse, CalendarEventsResponse, CalendarSyncResponse, ErrorResponse
)
from app.services.auth import get_current_user


router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get(
    "/events",
    response_model=CalendarEventsResponse,
)
async def get_calendar_events(
    start_date: datetime = Query(..., description="Start of date range"),
    end_date: datetime = Query(..., description="End of date range"),
    provider: Optional[str] = Query(None, description="Filter by 'google' or 'microsoft'"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get external calendar events within a date range.
    
    Returns events synced from connected Google/Microsoft calendars.
    """
    query = select(ExternalEvent).where(
        and_(
            ExternalEvent.user_id == current_user.id,
            ExternalEvent.start_time >= start_date,
            ExternalEvent.end_time <= end_date,
        )
    )
    
    if provider:
        # Join with calendar_connections to filter by provider
        query = query.join(CalendarConnection).where(
            CalendarConnection.provider == provider
        )
    
    query = query.order_by(ExternalEvent.start_time.asc())
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    # Add source info from connection
    event_responses = []
    for event in events:
        # Get provider from connection
        conn_result = await db.execute(
            select(CalendarConnection).where(CalendarConnection.id == event.connection_id)
        )
        connection = conn_result.scalar_one_or_none()
        
        event_response = ExternalEventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            start_time=event.start_time,
            end_time=event.end_time,
            is_all_day=event.is_all_day,
            location=event.location,
            source=connection.provider if connection else "unknown",
        )
        event_responses.append(event_response)
    
    return CalendarEventsResponse(events=event_responses)


@router.get(
    "/connections",
    response_model=list,
)
async def get_calendar_connections(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List connected calendar services.
    """
    result = await db.execute(
        select(CalendarConnection).where(CalendarConnection.user_id == current_user.id)
    )
    connections = result.scalars().all()
    
    return [
        {
            "id": str(conn.id),
            "provider": conn.provider,
            "last_synced_at": conn.last_synced_at.isoformat() if conn.last_synced_at else None,
            "created_at": conn.created_at.isoformat(),
        }
        for conn in connections
    ]


@router.post(
    "/sync",
    response_model=CalendarSyncResponse,
)
async def sync_calendar(
    connection_id: Optional[uuid.UUID] = Query(None, description="Specific connection to sync"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger a sync of external calendar events.
    
    Note: This is a placeholder. Full implementation requires
    Google Calendar API and Microsoft Graph API integration.
    """
    # Get connections to sync
    query = select(CalendarConnection).where(CalendarConnection.user_id == current_user.id)
    if connection_id:
        query = query.where(CalendarConnection.id == connection_id)
    
    result = await db.execute(query)
    connections = result.scalars().all()
    
    if not connections:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No calendar connections found. Please connect a calendar first.",
        )
    
    synced_count = 0
    
    for connection in connections:
        # TODO: Implement actual sync with Google/Microsoft APIs
        # For now, just update last_synced_at
        connection.last_synced_at = datetime.utcnow()
        synced_count += 1
    
    return CalendarSyncResponse(
        synced_events=synced_count,
        last_synced_at=datetime.utcnow(),
    )


# OAuth endpoints would go here - placeholder for now
@router.get("/connect/google")
async def connect_google():
    """
    Initiate Google Calendar OAuth flow.
    
    Note: Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to be configured.
    """
    return {
        "message": "Google OAuth not yet configured",
        "instruction": "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env",
    }


@router.get("/connect/microsoft")
async def connect_microsoft():
    """
    Initiate Microsoft Calendar OAuth flow.
    
    Note: Requires MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET to be configured.
    """
    return {
        "message": "Microsoft OAuth not yet configured",
        "instruction": "Set MICROSOFT_CLIENT_ID and MICROSOFT_CLIENT_SECRET in .env",
    }
