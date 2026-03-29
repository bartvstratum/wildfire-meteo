from pathlib import Path

import numpy as np
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from skewT import SkewT_lines

app = FastAPI()

# Cache background lines at startup (they never change).
_stl = SkewT_lines()
_stl.calc()


@app.get("/api/background")
def background():
    return {
        "skew_factor":    _stl.skew_factor,
        "p1":             _stl.p1_lin.tolist(),
        "p2":             _stl.p2.tolist(),
        "p2_lin":         _stl.p2_lin.tolist(),
        "isotherms":      _stl.isotherms.T.tolist(),
        "dry_adiabats":   _stl.dry_adiabats.T.tolist(),
        "moist_adiabats": _stl.moist_adiabats.T.tolist(),
        "isohumes":       _stl.isohumes.T.tolist(),
    }


# Serve the frontend. Must be last so API routes take priority.
app.mount("/", StaticFiles(directory=Path(__file__).parent.parent / "web", html=True))
