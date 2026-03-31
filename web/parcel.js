//
// Copyright 2026 Wageningen University & Research (WUR)
// Author: Bart van Stratum
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//

import { exner, qsat, dewpoint, calc_moist_adiabat } from "./thermo.js";


export function find_lcl(T_sfc, Td_sfc, p_sfc, tol=5)
{
    const theta_sfc = T_sfc / exner(p_sfc);
    const q_sfc     = qsat(Td_sfc, p_sfc);

    const residual = p => theta_sfc * exner(p) - dewpoint(q_sfc, p);

    let p_lo = 500e2;
    let p_hi = p_sfc;

    while ((p_hi - p_lo) > tol)
    {
        const p_mid = 0.5 * (p_lo + p_hi);
        if (residual(p_mid) > 0)
            p_hi = p_mid;
        else
            p_lo = p_mid;
    }

    const p_lcl = 0.5 * (p_lo + p_hi);
    const T_lcl = theta_sfc * exner(p_lcl);

    return { p_lcl, T_lcl };
}


export function calc_non_entraining_parcel(T_sfc, Td_sfc, p_sfc, p)
{
    // p must be in Pa, sorted descending (surface to top).
    const theta_sfc = T_sfc / exner(p_sfc);
    const q_sfc     = qsat(Td_sfc, p_sfc);
    const { p_lcl, T_lcl } = find_lcl(T_sfc, Td_sfc, p_sfc);

    // Below LCL: isohume and dry adiabat.
    const p_dry    = [...p.filter(pi => pi >= p_lcl), p_lcl];
    const T_dry    = p_dry.map(pi => theta_sfc * exner(pi));
    const T_isohume = p_dry.map(pi => dewpoint(q_sfc, pi));

    // Above LCL: moist adiabat on a geomspace grid matching the background resolution.
    const p_top    = Math.min(...p);
    const log_step = Math.log(105000 / 10000) / (200 - 1);
    const n_moist  = Math.round(Math.log(p_lcl / p_top) / log_step) + 1;
    const p_moist  = Array.from({ length: n_moist }, (_, i) =>
        Math.exp(Math.log(p_lcl) + i * (Math.log(p_top) - Math.log(p_lcl)) / (n_moist - 1)));
    const T_moist = calc_moist_adiabat(T_lcl, p_moist);

    return {
        T_isohume,
        p_isohume: p_dry,
        T_dry,
        p_dry,
        T_moist,
        p_moist,
    };
}
