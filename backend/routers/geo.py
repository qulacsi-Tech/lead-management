"""geo.py — Public geographic lookup endpoints for India (state → district → block)."""

from fastapi import APIRouter, HTTPException
from typing import List

from data.india_geo import get_states, get_districts, get_blocks

router = APIRouter(prefix="/geo", tags=["Geography"])


@router.get("/states", response_model=List[str], summary="List all Indian states & UTs")
async def list_states():
    return get_states()


@router.get(
    "/districts/{state}",
    response_model=List[str],
    summary="List districts for a given state/UT",
)
async def list_districts(state: str):
    districts = get_districts(state)
    if not districts:
        raise HTTPException(status_code=404, detail=f"State '{state}' not found.")
    return districts


@router.get(
    "/blocks/{state}/{district}",
    response_model=List[str],
    summary="List blocks/mandals/talukas for a given district",
)
async def list_blocks(state: str, district: str):
    blocks = get_blocks(state, district)
    if not blocks:
        raise HTTPException(
            status_code=404,
            detail=f"District '{district}' in '{state}' not found.",
        )
    return blocks
