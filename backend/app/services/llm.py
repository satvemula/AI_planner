"""
LLM service for task duration estimation.
"""
import json
import re
from typing import Optional
from openai import AsyncOpenAI
from pydantic import BaseModel

from app.config import settings
from app.schemas import DurationEstimateResponse


SYSTEM_PROMPT = """You are a task duration estimation assistant. 
Given a task description, estimate how long it will take to complete in minutes.

Consider factors like:
- Task complexity and scope
- Typical time for similar tasks
- Number of sub-steps involved
- Potential interruptions or context switching

Respond ONLY with valid JSON in this exact format:
{
  "estimated_duration": <integer minutes between 5 and 480>,
  "confidence": <float between 0.0 and 1.0>,
  "reasoning": "<brief one-line explanation>"
}
"""


class DurationEstimate(BaseModel):
    """Internal model for LLM response."""
    estimated_duration: int
    confidence: float
    reasoning: str


async def estimate_duration_with_llm(task_description: str) -> DurationEstimateResponse:
    """
    Use OpenAI API to estimate task duration.
    
    Args:
        task_description: Natural language description of the task
        
    Returns:
        DurationEstimateResponse with estimated minutes and confidence
    """
    if not settings.OPENAI_API_KEY:
        # Fallback to heuristic estimation if no API key
        return estimate_duration_heuristic(task_description)
    
    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        response = await client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": f"Estimate duration for this task: {task_description}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=150,
        )
        
        content = response.choices[0].message.content
        result = json.loads(content)
        
        # Validate and clamp values
        duration = max(5, min(480, int(result.get("estimated_duration", 30))))
        confidence = max(0.0, min(1.0, float(result.get("confidence", 0.7))))
        reasoning = result.get("reasoning", "")
        
        return DurationEstimateResponse(
            estimated_duration=duration,
            confidence=confidence,
            reasoning=reasoning,
        )
        
    except Exception as e:
        # Fallback to heuristic on any error
        print(f"LLM estimation failed: {e}")
        return estimate_duration_heuristic(task_description)


def estimate_duration_heuristic(task_description: str) -> DurationEstimateResponse:
    """
    Fallback heuristic-based duration estimation when LLM is unavailable.
    Uses keyword matching to estimate task duration.
    """
    description_lower = task_description.lower()
    
    # Keyword patterns with associated durations
    patterns = [
        (["meeting", "call", "standup", "sync", "interview"], 30),
        (["review", "check", "approve", "feedback"], 20),
        (["email", "reply", "respond", "message"], 15),
        (["quick", "brief", "short", "simple"], 10),
        (["write", "draft", "document", "report", "proposal"], 60),
        (["research", "investigate", "analyze", "explore"], 90),
        (["design", "create", "build", "develop", "implement"], 120),
        (["deep", "thorough", "comprehensive", "detailed"], 90),
        (["workout", "gym", "exercise", "run", "yoga"], 45),
        (["lunch", "dinner", "breakfast", "break"], 30),
        (["learn", "study", "course", "training", "tutorial"], 60),
        (["plan", "schedule", "organize", "prepare"], 25),
        (["fix", "debug", "troubleshoot", "resolve"], 45),
        (["clean", "tidy", "organize", "declutter"], 30),
        (["read", "book", "article", "paper"], 30),
        (["test", "testing", "qa", "verify"], 40),
        (["deploy", "release", "publish", "launch"], 30),
    ]
    
    for keywords, duration in patterns:
        if any(kw in description_lower for kw in keywords):
            # Add some variance based on description length
            word_count = len(task_description.split())
            variance = min(word_count * 2, 15)
            final_duration = duration + variance
            
            return DurationEstimateResponse(
                estimated_duration=final_duration,
                confidence=0.6,
                reasoning=f"Estimated based on task keywords (heuristic method)",
            )
    
    # Default: estimate based on word count
    word_count = len(task_description.split())
    base_duration = max(15, min(word_count * 8, 90))
    
    return DurationEstimateResponse(
        estimated_duration=base_duration,
        confidence=0.5,
        reasoning="General estimate based on task description length",
    )
