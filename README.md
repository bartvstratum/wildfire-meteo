# Wildfire meteorology 🌳🔥

ODET wildfire & meteo analysis tool.

Live development version: https://wildfire-meteo-9975c490.fastapicloud.dev/

## Local install

New:
- Install package locally with `pip install -e .`
- Start server with `fastapi dev`

To deploy to FastAPI cloud:
- `fastapi login`
- `fastapi deploy`

Old:
- Install requirements with `pip install -r requirements.txt`
- Launch app from `api` with `uvicorn main:app --reload`
