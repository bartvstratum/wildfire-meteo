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

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from skewT import get_static_lines

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


# Serve the frontend. Must be last so API routes take priority.
app.mount("/", StaticFiles(directory=Path(__file__).parent.parent / "web", html=True))