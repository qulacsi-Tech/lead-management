@echo off
REM Start the ParentLead Management backend (FastAPI)
py -m uvicorn main:app --reload %*
