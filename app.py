import math

class RadarSystem:
    # Constants
    SAMPLING_FREQ = 40e6  # (Hz)
    C = 3e8  # Speed of light (m/s)
    N_TX_MAX = 8
    N_RX_MAX = 8
    DWELL_TIME = 2e-6  # (seconds)
    SETTLE_TIME = 1e-6  # (seconds)
    RESET_TIME = 1e-6  # (seconds)
    JUMPBACK_TIME = 0.3e-6  # (seconds)
    DC_POWER_ON_DELAY_TIME = 2e-6  # (seconds)

    def __init__(self, acquisition_samples, range_res, range_max, velocity_max, velocity_res, angular_res, frequency):
        # User-defined inputs
        self.acquisition_samples = acquisition_samples
        self.range_res = range_res
        self.range_max = range_max
        self.velocity_max = velocity_max
        self.velocity_res = velocity_res
        self.angular_res = angular_res
        self.frequency = frequency

        # Derived attributes
        self.sampling_time = 1 / self.SAMPLING_FREQ
        self.acquisition_time = self.acquisition_samples * self.sampling_time
        self.wavelength = self.C / self.frequency
        self.p = self.wavelength / 2  # Antenna spacing (m)
        self.velocity_res = self.convert_velocity_resolution(self.velocity_res)

    def convert_velocity_resolution(self, velocity_res):
        return velocity_res * (5 / 18)  # Convert km/hr to m/s

    def calculate_required_bandwidth(self):
        if_bandwidth = self.SAMPLING_FREQ / 2
        required_bandwidth_rmax = (if_bandwidth * self.C * self.acquisition_time) / (2 * self.range_max)
        required_bandwidth_rres = self.C / (2 * self.range_res)
        return required_bandwidth_rmax, required_bandwidth_rres

    def calculate_sweep_bandwidth(self):
        required_bandwidth_rmax, required_bandwidth_rres = self.calculate_required_bandwidth()
        if required_bandwidth_rres > required_bandwidth_rmax:
            sweep_bandwidth = required_bandwidth_rmax
            range_res_measurable = self.C / (2 * sweep_bandwidth)
            range_max_measurable = self.range_max
        else:
            sweep_bandwidth = required_bandwidth_rres
            range_res_measurable = self.range_res
            range_max_measurable = (self.SAMPLING_FREQ / 2 * self.C * self.acquisition_time) / (2 * sweep_bandwidth)
        return sweep_bandwidth, range_res_measurable, range_max_measurable

    def calculate_sweep_frequencies(self, sweep_bandwidth):
        sweep_frequency_start = self.frequency  
        slope = self.calculate_slope(sweep_bandwidth, self.acquisition_time)
        sweep_frequency_stop = self.frequency + sweep_bandwidth + slope*(self.JUMPBACK_TIME + self.SETTLE_TIME) 
        return sweep_frequency_start, sweep_frequency_stop

    def calculate_slope(self, sweep_bandwidth, acquisition_time):
        return sweep_bandwidth / acquisition_time

    def calculate_velocity_max_measurable(self):
        chirp_time_min = self.acquisition_time + self.DWELL_TIME + self.SETTLE_TIME + self.RESET_TIME+ self.JUMPBACK_TIME 
        if self.velocity_max > (self.wavelength * 3.6) / (4 * chirp_time_min):
            idle_time = 0
            required_chirp_time = chirp_time_min
            velocity_max_measurable = (self.wavelength * 3.6) / (4 * required_chirp_time)
        else:
            required_chirp_time = (self.wavelength * 3.6) / (4 * self.velocity_max)
            idle_time = required_chirp_time - (self.DWELL_TIME + self.SETTLE_TIME + self.acquisition_time + self.RESET_TIME + self.JUMPBACK_TIME)
            velocity_max_measurable = self.velocity_max
        return required_chirp_time, idle_time, velocity_max_measurable

    def calculate_no_of_chirps(self, required_chirp_time):
        no_of_chirps = math.floor(self.wavelength / (2 * self.velocity_res * required_chirp_time))
        frame_time = no_of_chirps * required_chirp_time * 1000  # (ms)
        return no_of_chirps, frame_time

    def calculate_angular_resolution_measurable(self):
        angular_res_best = self.wavelength / (self.p * self.N_TX_MAX * self.N_RX_MAX * math.cos(0) * (math.pi / 180))
        if self.angular_res < angular_res_best:
            angular_res_measurable = angular_res_best
            ntx = self.N_TX_MAX
            nrx = self.N_RX_MAX
        else:
            ant_product = math.floor(self.wavelength / (self.p * self.angular_res * (math.pi / 180) * math.cos(0)))
            angular_res_measurable = self.angular_res
            ntx = math.ceil(math.sqrt(ant_product))
            nrx = math.ceil(math.sqrt(ant_product))
        return angular_res_measurable, ntx, nrx

    def calculate_time_of_flight(self):
        return (2 * self.range_max) / self.C

    def calculate_memory_required(self, no_of_chirps, required_chirp_time, nrx):
        return no_of_chirps * (required_chirp_time / self.sampling_time) * nrx

    def print_outputs(self):
        sweep_bandwidth, range_res_measurable, range_max_measurable = self.calculate_sweep_bandwidth()
        sweep_frequency_start, sweep_frequency_stop = self.calculate_sweep_frequencies(sweep_bandwidth)
        required_chirp_time, idle_time, velocity_max_measurable = self.calculate_velocity_max_measurable()
        no_of_chirps, frame_time = self.calculate_no_of_chirps(required_chirp_time)
        angular_res_measurable, ntx, nrx = self.calculate_angular_resolution_measurable()
        tof = self.calculate_time_of_flight()
        memory_required = self.calculate_memory_required(no_of_chirps, required_chirp_time, nrx)

        print("\nRequested Parameters : \t\t\tObtained Parameters : ")
        print("\n All parameters are based on taking IF_Max = 40 MHz")
        print(f"Range max = {self.range_max} m\t\t\tRange max = {range_max_measurable} m")
        print(f"Range res = {self.range_res} m\t\t\tRange res = {range_res_measurable:.3f} m")
        print(f"Velocity max = {self.velocity_max} km/hr \t\tVelocity max = {velocity_max_measurable:.2f} km/hr")
        print(f"Velocity res = {self.velocity_res * (18 / 5):.2f} km/hr \t\tVelocity res = {self.velocity_res * (18 / 5):.2f} km/hr")
        print(f"Angular res = {self.angular_res:.2f} deg \t\t\tAngular res = {angular_res_measurable:.2f} deg")

        print("\n\nCHIRP Frequency Parameters")
        print(f"\tStarting frequency = {sweep_frequency_start / 1e9} GHz")
        print(f"\tCenter frequency = {(sweep_frequency_stop-sweep_frequency_start ) / 2e9 + sweep_frequency_start / 1e9} GHz")
        print(f"\tEnding frequency = {sweep_frequency_stop / 1e9} GHz")
        print(f"\tCHIRP ADC bandwidth = {sweep_bandwidth / 1e6} MHz")
        print(f"\tCHIRP Full bandwidth = {(sweep_frequency_stop-sweep_frequency_start ) / 1e6} MHz")

        print("\nCHIRP Timing Parameters : ")
        print(f"\tDC power on delay time = {self.DC_POWER_ON_DELAY_TIME * 1e6:.2f} us")
        print(f"\tDwell time = {self.DWELL_TIME * 1e6:.2f} us")
        print(f"\tSettle time = {self.SETTLE_TIME * 1e6:.2f} us")
        print(f"\tAcquisition time = {self.acquisition_time * 1e6:.2f} us")
        print(f"\tReset time = {self.RESET_TIME * 1e6:.2f} us")
        print(f"\tJumpback time = {self.JUMPBACK_TIME * 1e6:.2f} us")
        
        print(f"\tIdle time = {idle_time * 1e6:.2f} us")
        print(f"\tCHIRP time = {required_chirp_time * 1e6:.2f} us")

        print("\nFrame Parameters : ")
        print(f"\tFrame time = {frame_time:.2f} ms")
        print(f"\tNumber of chirps per frame = {no_of_chirps}")

        print("\n Minimum Number of Antennas :")
        print(f"\tTX : {ntx}\n\tRX : {nrx}")

        print(f"\nTime of flight to target = {tof * 1e6:.2f} us")

        print("\nIF bandwidth corresponding to the requested range max of {}m : ".format(self.range_max))
        for chirp_bw in range(200, 2100, 100):
            if_bandwidth_required = (2 * self.range_max * chirp_bw * 1e6) / (self.C * self.acquisition_time)
            print(f"\tChirp Bandwidth {chirp_bw} MHz : Required IF bandwidth = {if_bandwidth_required / 1e6} MHz")
        print(f"\nMemory required = {memory_required / 1000} kilobits per frame")
        print("\n\n")


# Function to take input from the user
def take_user_input():
    print("Enter the following parameters:")
    range_res = float(input("Range resolution (m): "))
    range_max = float(input("Maximum range (m): "))
    velocity_max = float(input("Maximum velocity (km/hr): "))
    velocity_res = float(input("Velocity resolution (km/hr): "))
    angular_res = float(input("Angular resolution (degrees): "))
    frequency = float(input("Starting Frequency (GHz): "))
    return range_res, range_max, velocity_max, velocity_res, angular_res, frequency*1e9


# Function to process and display outputs for 3 cases
def process_and_display_outputs(range_res, range_max, velocity_max, velocity_res, angular_res, frequency):
    cases = [512, 1024, 2048]  # Acquisition samples for 3 cases
    for idx, acquisition_samples in enumerate(cases):
        print(f"\nCase {idx + 1}: Acquisition Samples = {acquisition_samples}")
        radar = RadarSystem(acquisition_samples, range_res, range_max, velocity_max, velocity_res, angular_res, frequency)
        radar.print_outputs()


# Main program
if __name__ == "__main__":
    # Take input from the user
    range_res, range_max, velocity_max, velocity_res, angular_res, frequency = take_user_input()

    # Process and display outputs for 3 cases
    process_and_display_outputs(range_res, range_max, velocity_max, velocity_res, angular_res, frequency)