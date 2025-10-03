export class GameState {
    constructor({ day = 1, energy = 100, chaos = 0, score = 0, powerCenters = [] } = {}) {
        this._listeners = new Set();
        this._transactionStack = [];
        this.powerHistory = [];
        this._phase = 'ACTIVE';

        this._knownPowerCenters = new Set();
        const normalizedPower = {};
        for (const center of powerCenters) {
            if (!center || typeof center.id !== 'string') continue;
            const id = center.id.trim().toLowerCase();
            if (!id) continue;
            this._knownPowerCenters.add(id);
            normalizedPower[id] = this.#clamp(center.value, 0, 100);
        }

        this._state = {
            day: this.#validateDay(day),
            energy: this.#clamp(energy, 0, 100),
            chaos: this.#clamp(chaos, 0, 100),
            score: this.#validateScore(score),
            power: normalizedPower
        };

        this.validate(this._state);
    }

    get phase() {
        return this._phase;
    }

    set phase(value) {
        const allowed = new Set(['INTRO', 'ACTIVE', 'GAME_OVER']);
        const next = (value || '').toUpperCase();
        if (!allowed.has(next)) {
            throw new Error(`Invalid phase "${value}"`);
        }
        this._phase = next;
    }

    get snapshot() {
        return {
            day: this._state.day,
            energy: this._state.energy,
            chaos: this._state.chaos,
            score: this._state.score,
            power: { ...this._state.power }
        };
    }

    get knownPowerCenters() {
        return new Set(this._knownPowerCenters);
    }

    onChange(cb) {
        if (typeof cb !== 'function') return () => {};
        this._listeners.add(cb);
        return () => this.offChange(cb);
    }

    offChange(cb) {
        this._listeners.delete(cb);
    }

    begin() {
        this._transactionStack.push(this.snapshot);
        return this._transactionStack.length;
    }

    rollback() {
        if (!this._transactionStack.length) return;
        const previous = this._transactionStack.pop();
        if (!previous) return;
        const current = this.snapshot;
        this._state = {
            day: previous.day,
            energy: previous.energy,
            chaos: previous.chaos,
            score: previous.score,
            power: { ...previous.power }
        };
        const diff = GameState.diff(current, previous);
        this.#emit(diff, current, this.snapshot, { phase: 'rollback' });
    }

    commit(meta = {}) {
        if (!this._transactionStack.length) return;
        this._transactionStack.pop();
        // commit simply clears the saved snapshot; state is already current
        if (meta && Object.keys(meta).length) {
            const snap = this.snapshot;
            this.#emit({}, snap, snap, { ...meta, phase: 'commit' });
        }
    }

    setDay(value) {
        const nextDay = this.#validateDay(value);
        this.#updateState({ day: nextDay }, { field: 'day' });
        return this._state.day;
    }

    setEnergy(value) {
        const nextEnergy = this.#clamp(value, 0, 100);
        this.#updateState({ energy: nextEnergy }, { field: 'energy' });
        return this._state.energy;
    }

    setChaos(value) {
        const nextChaos = this.#clamp(value, 0, 100);
        this.#updateState({ chaos: nextChaos }, { field: 'chaos' });
        return this._state.chaos;
    }

    setScore(value) {
        const nextScore = this.#validateScore(value);
        this.#updateState({ score: nextScore }, { field: 'score' });
        return this._state.score;
    }

    updatePower(id, delta, reason = '') {
        if (this._phase !== 'ACTIVE') {
            throw new Error('Cannot update power centers outside ACTIVE phase');
        }
        const centerId = this.#normalizeId(id);
        if (!this._knownPowerCenters.has(centerId)) {
            throw new Error(`Unknown power center: ${id}`);
        }
        const current = this.snapshot;
        const oldValue = current.power[centerId] ?? 0;
        const newValue = this.#clamp(oldValue + Number(delta || 0), 0, 100);
        const next = {
            ...current,
            power: { ...current.power, [centerId]: newValue }
        };
        this.validate(next);
        this._state = {
            day: next.day,
            energy: next.energy,
            chaos: next.chaos,
            score: next.score,
            power: { ...next.power }
        };
        const diff = GameState.diff(current, this.snapshot);
        const change = {
            id: centerId,
            oldValue,
            newValue,
            change: newValue - oldValue,
            reason
        };
        if (change.change !== 0) {
            this.powerHistory.push({ ...change, timestamp: Date.now() });
        }
        this.#emit(diff, current, this.snapshot, {
            type: 'power',
            reason,
            powerChanges: [change]
        });
        return change;
    }

    applyEffects({ chaosDelta = 0, energyDelta = 0, power = {}, scoreDelta = 0 } = {}, meta = {}) {
        if (this._phase !== 'ACTIVE') {
            throw new Error('Cannot apply effects outside ACTIVE phase');
        }
        const current = this.snapshot;
        const next = {
            day: current.day,
            energy: this.#clamp(current.energy + Number(energyDelta || 0), 0, 100),
            chaos: this.#clamp(current.chaos + Number(chaosDelta || 0), 0, 100),
            score: this.#validateScore(current.score + Number(scoreDelta || 0)),
            power: { ...current.power }
        };

        const powerChanges = [];
        if (power && typeof power === 'object') {
            for (const [rawId, delta] of Object.entries(power)) {
                if (!delta) continue;
                const centerId = this.#normalizeId(rawId);
                if (!this._knownPowerCenters.has(centerId)) {
                    throw new Error(`Unknown power center: ${rawId}`);
                }
                const oldValue = next.power[centerId] ?? 0;
                const newValue = this.#clamp(oldValue + Number(delta || 0), 0, 100);
                if (oldValue === newValue) continue;
                next.power[centerId] = newValue;
                powerChanges.push({
                    id: centerId,
                    oldValue,
                    newValue,
                    change: newValue - oldValue,
                    reason: meta?.powerReasons?.[centerId] ?? meta?.reason ?? ''
                });
            }
        }

        this.validate(next);

        this._state = {
            day: next.day,
            energy: next.energy,
            chaos: next.chaos,
            score: next.score,
            power: { ...next.power }
        };

        if (powerChanges.length) {
            for (const change of powerChanges) {
                this.powerHistory.push({ ...change, timestamp: Date.now() });
            }
        }

        const diff = GameState.diff(current, this.snapshot);
        this.#emit(diff, current, this.snapshot, {
            ...meta,
            powerChanges
        });
        return { diff, snapshot: this.snapshot, powerChanges };
    }

    validate(next) {
        if (!Number.isFinite(next.energy)) throw new Error('Energy must be a finite number');
        if (!Number.isFinite(next.chaos)) throw new Error('Chaos must be a finite number');
        if (!Number.isFinite(next.score)) throw new Error('Score must be a finite number');
        if (next.energy < 0 || next.energy > 100) throw new Error('Energy out of range');
        if (next.chaos < 0 || next.chaos > 100) throw new Error('Chaos out of range');
        if (next.score < 0) throw new Error('Score cannot be negative');
        if (!Number.isInteger(next.day) || next.day < 1) throw new Error('Day must be >= 1');
        for (const id of Object.keys(next.power || {})) {
            if (!this._knownPowerCenters.has(id)) {
                throw new Error(`Unknown power center: ${id}`);
            }
            const value = next.power[id];
            if (!Number.isFinite(value)) {
                throw new Error(`Power center ${id} has invalid value`);
            }
            if (value < 0 || value > 100) {
                throw new Error(`Power center ${id} value out of range`);
            }
        }
        return true;
    }

    static diff(prev, next) {
        const diff = {};
        if (prev.day !== next.day) diff.day = [prev.day, next.day];
        if (prev.energy !== next.energy) diff.energy = [prev.energy, next.energy];
        if (prev.chaos !== next.chaos) diff.chaos = [prev.chaos, next.chaos];
        if (prev.score !== next.score) diff.score = [prev.score, next.score];
        const powerDiff = {};
        const keys = new Set([
            ...Object.keys(prev.power || {}),
            ...Object.keys(next.power || {})
        ]);
        for (const key of keys) {
            const a = (prev.power || {})[key];
            const b = (next.power || {})[key];
            if (a !== b) {
                powerDiff[key] = [a, b];
            }
        }
        if (Object.keys(powerDiff).length) {
            diff.power = powerDiff;
        }
        return diff;
    }

    #updateState(partial, meta = {}) {
        const current = this.snapshot;
        const next = {
            ...current,
            ...partial,
            power: { ...current.power }
        };
        this.validate(next);
        this._state = {
            day: next.day,
            energy: next.energy,
            chaos: next.chaos,
            score: next.score,
            power: { ...next.power }
        };
        const diff = GameState.diff(current, this.snapshot);
        if (Object.keys(diff).length) {
            this.#emit(diff, current, this.snapshot, meta);
        }
    }

    #emit(diff, prev, next, meta = {}) {
        for (const listener of this._listeners) {
            try {
                listener(diff, prev, next, meta);
            } catch (err) {
                console.warn('GameState listener error:', err);
            }
        }
    }

    #validateDay(value) {
        const num = Number(value);
        if (!Number.isFinite(num) || num < 1) {
            throw new Error('Day must be >= 1');
        }
        return Math.floor(num);
    }

    #validateScore(value) {
        const num = Number(value);
        if (!Number.isFinite(num)) {
            throw new Error('Score must be a finite number');
        }
        return Math.max(0, num);
    }

    #clamp(value, min, max) {
        const num = Number(value);
        if (!Number.isFinite(num)) return min;
        if (num < min) return min;
        if (num > max) return max;
        return num;
    }

    #normalizeId(id) {
        return String(id || '').trim().toLowerCase();
    }
}
