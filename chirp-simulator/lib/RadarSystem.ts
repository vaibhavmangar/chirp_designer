export class RadarSystem {
    // Constants
    private static readonly SAMPLING_FREQ = 40e6;  // (Hz)
    private static readonly C = 3e8;  // Speed of light (m/s)
    private static readonly N_TX_MAX = 8;
    private static readonly N_RX_MAX = 8;
    private static readonly DWELL_TIME = 2e-6;  // (seconds)
    private static readonly SETTLE_TIME = 1e-6;  // (seconds)
    private static readonly RESET_TIME = 1e-6;  // (seconds)
    private static readonly JUMPBACK_TIME = 0.3e-6;  // (seconds)
    private static readonly DC_POWER_ON_DELAY_TIME = 2e-6;  // (seconds)

    // User-defined inputs
    private acquisition_samples: number;
    private range_res: number;
    private range_max: number;
    private velocity_max: number;
    private velocity_res: number;
    private angular_res: number;
    private frequency: number;

    // Derived attributes
    private sampling_time: number;
    private acquisition_time: number;
    private wavelength: number;
    private p: number;  // Antenna spacing (m)

    constructor(
        acquisition_samples: number,
        range_res: number,
        range_max: number,
        velocity_max: number,
        velocity_res: number,
        angular_res: number,
        frequency: number
    ) {
        this.acquisition_samples = acquisition_samples;
        this.range_res = range_res;
        this.range_max = range_max;
        this.velocity_max = velocity_max;
        this.velocity_res = this.convertVelocityResolution(velocity_res);
        this.angular_res = angular_res;
        this.frequency = frequency * 1e9; // Convert GHz to Hz

        // Initialize derived attributes
        this.sampling_time = 1 / RadarSystem.SAMPLING_FREQ;
        this.acquisition_time = this.acquisition_samples * this.sampling_time;
        this.wavelength = RadarSystem.C / this.frequency;
        this.p = this.wavelength / 2;
    }

    private convertVelocityResolution(velocity_res: number): number {
        return velocity_res * (5 / 18);  // Convert km/hr to m/s
    }

    private calculateRequiredBandwidth(): [number, number] {
        const if_bandwidth = RadarSystem.SAMPLING_FREQ / 2;
        const required_bandwidth_rmax = (if_bandwidth * RadarSystem.C * this.acquisition_time) / (2 * this.range_max);
        const required_bandwidth_rres = RadarSystem.C / (2 * this.range_res);
        return [required_bandwidth_rmax, required_bandwidth_rres];
    }

    private calculateSweepBandwidth(): [number, number, number] {
        const [required_bandwidth_rmax, required_bandwidth_rres] = this.calculateRequiredBandwidth();
        let sweep_bandwidth: number;
        let range_res_measurable: number;
        let range_max_measurable: number;

        if (required_bandwidth_rres > required_bandwidth_rmax) {
            sweep_bandwidth = required_bandwidth_rmax;
            range_res_measurable = RadarSystem.C / (2 * sweep_bandwidth);
            range_max_measurable = this.range_max;
        } else {
            sweep_bandwidth = required_bandwidth_rres;
            range_res_measurable = this.range_res;
            range_max_measurable = (RadarSystem.SAMPLING_FREQ / 2 * RadarSystem.C * this.acquisition_time) / (2 * sweep_bandwidth);
        }
        return [sweep_bandwidth, range_res_measurable, range_max_measurable];
    }

    private calculateVelocityMaxMeasurable(): [number, number, number] {
        const chirp_time_min = this.acquisition_time + RadarSystem.DWELL_TIME + 
                              RadarSystem.SETTLE_TIME + RadarSystem.RESET_TIME + 
                              RadarSystem.JUMPBACK_TIME;
        
        let idle_time: number;
        let required_chirp_time: number;
        let velocity_max_measurable: number;

        if (this.velocity_max > (this.wavelength * 3.6) / (4 * chirp_time_min)) {
            idle_time = 0;
            required_chirp_time = chirp_time_min;
            velocity_max_measurable = (this.wavelength * 3.6) / (4 * required_chirp_time);
        } else {
            required_chirp_time = (this.wavelength * 3.6) / (4 * this.velocity_max);
            idle_time = required_chirp_time - (RadarSystem.DWELL_TIME + RadarSystem.SETTLE_TIME + 
                        this.acquisition_time + RadarSystem.RESET_TIME + RadarSystem.JUMPBACK_TIME);
            velocity_max_measurable = this.velocity_max;
        }
        return [required_chirp_time, idle_time, velocity_max_measurable];
    }

    private calculateNoOfChirps(required_chirp_time: number): [number, number] {
        const no_of_chirps = Math.floor(this.wavelength / (2 * this.velocity_res * required_chirp_time));
        const frame_time = no_of_chirps * required_chirp_time * 1000;  // Convert to ms
        return [no_of_chirps, frame_time];
    }

    private calculateAngularResolutionMeasurable(): [number, number, number] {
        const angular_res_best = this.wavelength / (this.p * RadarSystem.N_TX_MAX * 
                               RadarSystem.N_RX_MAX * Math.cos(0) * (Math.PI / 180));
        
        let angular_res_measurable: number;
        let ntx: number;
        let nrx: number;

        if (this.angular_res < angular_res_best) {
            angular_res_measurable = angular_res_best;
            ntx = RadarSystem.N_TX_MAX;
            nrx = RadarSystem.N_RX_MAX;
        } else {
            const ant_product = Math.floor(this.wavelength / (this.p * this.angular_res * 
                              (Math.PI / 180) * Math.cos(0)));
            angular_res_measurable = this.angular_res;
            ntx = Math.ceil(Math.sqrt(ant_product));
            nrx = Math.ceil(Math.sqrt(ant_product));
        }
        return [angular_res_measurable, ntx, nrx];
    }

    public calculateResults() {
        const [sweep_bandwidth, range_res_measurable, range_max_measurable] = this.calculateSweepBandwidth();
        const sweep_frequency_start = this.frequency;
        const sweep_frequency_stop = this.frequency + sweep_bandwidth;
        const [required_chirp_time, idle_time, velocity_max_measurable] = this.calculateVelocityMaxMeasurable();
        const [no_of_chirps, frame_time] = this.calculateNoOfChirps(required_chirp_time);
        const [angular_res_measurable, ntx, nrx] = this.calculateAngularResolutionMeasurable();
        const tof = (2 * this.range_max) / RadarSystem.C;
        const memory_required = no_of_chirps * (required_chirp_time / this.sampling_time) * nrx;

        const ifBandwidthTable = Array.from({ length: 20 }, (_, i) => {
            const chirp_bw = (i + 2) * 100;
            const if_bandwidth_required = (2 * this.range_max * chirp_bw * 1e6) / 
                                       (RadarSystem.C * this.acquisition_time);
            return { chirp_bw, if_bandwidth: if_bandwidth_required / 1e6 };
        });

        return {
            requestedParams: {
                range_max: this.range_max,
                range_res: this.range_res,
                velocity_max: this.velocity_max,
                velocity_res: this.velocity_res * (18 / 5),
                angular_res: this.angular_res
            },
            obtainedParams: {
                range_max: range_max_measurable,
                range_res: range_res_measurable,
                velocity_max: velocity_max_measurable,
                velocity_res: this.velocity_res * (18 / 5),
                angular_res: angular_res_measurable
            },
            chirpFrequency: {
                start: sweep_frequency_start / 1e9,
                center: (sweep_frequency_start / 1e9) + (sweep_bandwidth / 2e9),
                end: sweep_frequency_stop / 1e9,
                bandwidth: sweep_bandwidth / 1e6
            },
            timing: {
                dc_power_delay: RadarSystem.DC_POWER_ON_DELAY_TIME * 1e6,
                dwell: RadarSystem.DWELL_TIME * 1e6,
                settle: RadarSystem.SETTLE_TIME * 1e6,
                acquisition: this.acquisition_time * 1e6,
                reset: RadarSystem.RESET_TIME * 1e6,
                jumpback: RadarSystem.JUMPBACK_TIME * 1e6,
                idle: idle_time * 1e6,
                chirp: required_chirp_time * 1e6
            },
            frame: {
                time: frame_time,
                chirps: no_of_chirps
            },
            antennas: {
                tx: ntx,
                rx: nrx
            },
            timeOfFlight: tof * 1e6,
            ifBandwidthTable,
            memoryRequired: memory_required / 1000
        };
    }
} 