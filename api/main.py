#
# Copyright 2026 Wageningen University & Research (WUR)
# Author: Bart van Stratum
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.staticfiles import StaticFiles

import numpy as np
import pandas as pd
from skewT import get_static_lines, skew_transform
from open_meteo import get_sounding

app = FastAPI()

# Cache at startup — background lines never change.
_lines = get_static_lines(skew_factor=35, ktot=64)


@app.get("/api/background")
def background():
    return {
        "p_isotherms":    _lines["p_isotherms"].tolist(),
        "p_dry":          _lines["p_dry"].tolist(),
        "p_moist":        _lines["p_moist"].tolist(),
        "p_isohumes":     _lines["p_isohumes"].tolist(),
        "isotherms":      _lines["isotherms"].T.tolist(),
        "dry_adiabats":   _lines["dry_adiabats"].T.tolist(),
        "moist_adiabats": _lines["moist_adiabats"].T.tolist(),
        "isohumes":       _lines["isohumes"].T.tolist(),
    }


@app.get("/api/sounding")
def sounding():
    # Hardcoded example sounding (mid-latitude summer).
    p_hpa = np.array([1013, 925, 850, 700, 500, 400, 300, 250, 200, 100], dtype=float)
    T_c   = np.array([  25,  20,  14,   5,  -8, -18, -36, -46, -57, -70], dtype=float)
    Td_c  = np.array([  16,  13,   9,   0, -20, -33, -52, -62, -72, -85], dtype=float)

    p_pa = p_hpa * 100
    T_skew  = skew_transform(T_c  + 273.15, p_pa, skew_factor=35)
    Td_skew = skew_transform(Td_c + 273.15, p_pa, skew_factor=35)

    return {
        "p_hpa":  p_hpa.tolist(),
        "T":      T_skew.tolist(),
        "Td":     Td_skew.tolist(),
    }


@app.get("/api/model_sounding")
def model_sounding(
    lat:   float = Query(...),
    lon:   float = Query(...),
    model: str   = Query(...),
    date:  str   = Query(...),
):
    try:
        ds = get_sounding(lat, lon, model, date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    p_pa   = ds["p"].values
    n_time = ds.sizes["time"]

    T_k  = ds["T"].values   # (time, p)
    Td_k = ds["Td"].values  # (time, p)

    T_skew  = np.array([skew_transform(T_k[t],  p_pa, skew_factor=35) for t in range(n_time)])
    Td_skew = np.array([skew_transform(Td_k[t], p_pa, skew_factor=35) for t in range(n_time)])

    return {
        "p_hpa":  (p_pa / 100).tolist(),
        "times":  pd.DatetimeIndex(ds["time"].values).strftime("%H:%M").tolist(),
        "T":      T_skew.tolist(),
        "Td":     Td_skew.tolist(),
        "z":      ds["z"].values.tolist(),
        "z_agl":  ds["z_agl"].values.tolist(),
        "rh":     ds["rh"].values.tolist(),
        "ws":     ds["ws"].values.tolist(),
        "wd":     ds["wd"].values.tolist(),
        "qt":     ds["qt"].values.tolist(),
        "ql":     ds["ql"].values.tolist(),
        "theta":  ds["theta"].values.tolist(),
        "thetav": ds["thetav"].values.tolist(),
    }


# Serve the frontend. Must be last so API routes take priority.
app.mount("/", StaticFiles(directory=Path(__file__).parent.parent / "web", html=True))