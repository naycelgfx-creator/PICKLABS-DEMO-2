/**
 * useOraclePrediction — React hook
 * Fetches a full AIPrediction from PickLabs ORACLE (Gemini AI),
 * falling back to the local math engine if the API is unavailable.
 * Caching is handled inside geminiService to avoid duplicate calls.
 */
import { useState, useEffect } from 'react';
import { getOracleFullPrediction, AIPrediction } from '../data/geminiService';
import { generateAIPrediction } from '../data/espnTeams';

interface UseOraclePredictionArgs {
    homeTeam: string;
    awayTeam: string;
    sport: string;
    homeRecord: string;
    awayRecord: string;
    homeForm?: ('W' | 'L' | 'D')[];
    awayForm?: ('W' | 'L' | 'D')[];
    /** Skip fetching (e.g. game is final and no predictions needed) */
    skip?: boolean;
}

interface UseOraclePredictionResult {
    prediction: AIPrediction;
    loading: boolean;
    isOracle: boolean; // true = came from ORACLE, false = local fallback
}

export function useOraclePrediction({
    homeTeam,
    awayTeam,
    sport,
    homeRecord,
    awayRecord,
    homeForm = [],
    awayForm = [],
    skip = false,
}: UseOraclePredictionArgs): UseOraclePredictionResult {
    const localFallback = generateAIPrediction(homeRecord, awayRecord, sport, homeForm, awayForm);
    const [prediction, setPrediction] = useState<AIPrediction>(localFallback);
    const [loading, setLoading] = useState(!skip);
    const [isOracle, setIsOracle] = useState(false);

    useEffect(() => {
        if (skip) return;
        let cancelled = false;

        setLoading(true);
        getOracleFullPrediction(
            homeTeam, awayTeam, sport, homeRecord, awayRecord,
            homeForm.join(' '), awayForm.join(' ')
        ).then(result => {
            if (cancelled) return;
            if (result) {
                setPrediction(result);
                setIsOracle(true);
            }
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [homeTeam, awayTeam, sport, homeRecord, awayRecord]);

    return { prediction, loading, isOracle };
}
