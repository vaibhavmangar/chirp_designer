'use client';

import { useState } from 'react';
import { RadarSystem } from '../lib/RadarSystem';
import Image from 'next/image';

const ACQUISITION_SAMPLES = [512, 1024, 2048];

export default function Home() {
  const [formData, setFormData] = useState({
    range_res: '',
    range_max: '',
    velocity_max: '',
    velocity_res: '',
    angular_res: '',
    frequency: ''
  });

  const [results, setResults] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const results = ACQUISITION_SAMPLES.map(samples => {
      const radar = new RadarSystem(
        samples,
        Number(formData.range_res),
        Number(formData.range_max),
        Number(formData.velocity_max),
        Number(formData.velocity_res),
        Number(formData.angular_res),
        Number(formData.frequency)
      );
      return {
        samples,
        ...radar.calculateResults()
      };
    });

    setResults(results);
    setShowForm(false);
  };

  const handleNewCalculation = () => {
    setShowForm(true);
    setResults([]);
    setFormData({
      range_res: '',
      range_max: '',
      velocity_max: '',
      velocity_res: '',
      angular_res: '',
      frequency: ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-5xl mx-auto relative">
        <h1 className="text-4xl font-bold text-center mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
          Radar System Simulator
        </h1>

        {/* New Calculation Button */}
        {!showForm && (
          <button
            onClick={handleNewCalculation}
            className="absolute top-0 right-0 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200"
          >
            New Calculation
          </button>
        )}

        {/* Input Form */}
        {showForm && (
          <div className="bg-gray-800 rounded-xl p-6 shadow-xl mb-8">
            <h2 className="text-2xl font-semibold mb-6">Input Parameters</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Range Resolution (m)</label>
                  <input
                    type="number"
                    name="range_res"
                    value={formData.range_res}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Range (m)</label>
                  <input
                    type="number"
                    name="range_max"
                    value={formData.range_max}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Velocity (km/hr)</label>
                  <input
                    type="number"
                    name="velocity_max"
                    value={formData.velocity_max}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Velocity Resolution (km/hr)</label>
                  <input
                    type="number"
                    name="velocity_res"
                    value={formData.velocity_res}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Angular Resolution (degrees)</label>
                  <input
                    type="number"
                    name="angular_res"
                    value={formData.angular_res}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    step="any"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Starting Frequency (GHz)</label>
                  <input
                    type="number"
                    name="frequency"
                    value={formData.frequency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-gray-700 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    required
                    step="any"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-teal-600 transition-all duration-200"
              >
                Calculate Results
              </button>
            </form>
          </div>
        )}

        {/* Results Display */}
        {results.length > 0 && (
          <div className="space-y-8">
            {/* Radar Diagram Image */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <Image
                  src="/images/radar-diagram.svg"
                  alt="Radar System Diagram"
                  width={1246}
                  height={687}
                  className="rounded-lg shadow-xl"
                  priority
                />
                <svg
                  className="absolute top-0 left-0"
                  width="100%"
                  height="100%"
                  viewBox="0 0 1246 687"
                  preserveAspectRatio="xMinYMin meet"
                  style={{ pointerEvents: 'none' }}
                >
                  <text
                    x="1.5%"
                    y="29.5%"
                    className="fill-current text-black"
                    style={{ fontSize: "100%", fill: 'black' }}
                  >
                    {results[activeTab]?.chirpFrequency.end.toFixed(3)*1000}
                  </text>
                  <text
                    x="1.5%"
                    y="51.36%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {((results[activeTab]?.chirpFrequency.end - results[activeTab]?.chirpFrequency.start) / 2 + results[activeTab]?.chirpFrequency.start).toFixed(3)*1000}
                  </text>
                  <text
                    x="1.5%"
                    y="73.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.chirpFrequency.start.toFixed(3)*1000}
                  </text>
                  <text
                    x="6.5%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.dc_power_delay.toFixed(2)}
                  </text>
                  <text
                    x="12.5%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.dwell.toFixed(2)}
                  </text>
                  <text
                    x="16.5%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.settle.toFixed(2)}
                  </text>
                  <text
                    x="23.5%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.acquisition.toFixed(2)}
                  </text>
                  <text
                    x="29.5%"
                    y="92%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.jumpback.toFixed(2)}
                  </text>
                  <text
                    x="35%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.reset.toFixed(2)}
                  </text>
                  <text
                    x="40.5%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.idle.toFixed(2)}
                  </text>
                  <text
                    x="45%"
                    y="89.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.dwell.toFixed(2)}
                  </text>
                  <text
                    x="30%"
                    y="96.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.timing.chirp.toFixed(2)}
                  </text>
                  <text
                    x="52%"
                    y="53.47%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.frame.chirps}
                  </text>
                  <text
                    x="26%"
                    y="55%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {results[activeTab]?.chirpFrequency.bandwidth.toFixed(2)}
                  </text>
                  <text
                    x="32%"
                    y="55%"
                    className="fill-current text-black"
                    style={{ fontSize: '100%', fill: 'black' }}
                  >
                    {((results[activeTab]?.chirpFrequency.end - results[activeTab]?.chirpFrequency.start) * 1000).toFixed(2)}
                  </text>
                  
                </svg>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl p-6 shadow-xl">
              {/* Case Title */}
              <h2 className="text-3xl font-semibold text-center text-blue-400">
                Acquisition Samples = {results[activeTab].samples}
              </h2>

              {/* Case Selection Tabs */}
              <div className="flex justify-center space-x-4 mb-4">
                {results.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`px-6 py-2 rounded-lg text-lg transition-all duration-200 ${
                      activeTab === index
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Case {index + 1}
                  </button>
                ))}
              </div>

              {/* IF_Max Information */}
              <p className="text-center text-gray-400 mb-8">All parameters are based on taking IF_Max = 40 MHz</p>

              {results[activeTab] && (
                <div className="space-y-8">
                  {/* Parameters Section */}
                  <div className="grid grid-cols-2 gap-16">
                    <div>
                      <h3 className="text-2xl font-semibold mb-4 text-gray-300">Requested Parameters</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">RANGE MAX</span>
                          <span className="text-xl">{results[activeTab].requestedParams.range_max.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">RANGE RES</span>
                          <span className="text-xl">{results[activeTab].requestedParams.range_res.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">VELOCITY MAX</span>
                          <span className="text-xl">{results[activeTab].requestedParams.velocity_max.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">VELOCITY RES</span>
                          <span className="text-xl">{results[activeTab].requestedParams.velocity_res.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">ANGULAR RES</span>
                          <span className="text-xl">{results[activeTab].requestedParams.angular_res.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold mb-4 text-gray-300">Obtained Parameters</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">RANGE MAX</span>
                          <span className="text-xl">{results[activeTab].obtainedParams.range_max.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">RANGE RES</span>
                          <span className="text-xl">{results[activeTab].obtainedParams.range_res.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">VELOCITY MAX</span>
                          <span className="text-xl">{results[activeTab].obtainedParams.velocity_max.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">VELOCITY RES</span>
                          <span className="text-xl">{results[activeTab].obtainedParams.velocity_res.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">ANGULAR RES</span>
                          <span className="text-xl">{results[activeTab].obtainedParams.angular_res.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CHIRP Frequency Parameters */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-300">CHIRP Frequency Parameters</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">START FREQ</div>
                        <div className="text-xl">{results[activeTab].chirpFrequency.start.toFixed(2)} GHz</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">CENTER FREQ</div>
                        <div className="text-xl">{((results[activeTab].chirpFrequency.end - results[activeTab].chirpFrequency.start) / 2 + results[activeTab].chirpFrequency.start).toFixed(2)} GHz</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">END FREQ</div>
                        <div className="text-xl">{results[activeTab].chirpFrequency.end.toFixed(2)} GHz</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">ADC BANDWIDTH</div>
                        <div className="text-xl">{results[activeTab].chirpFrequency.bandwidth.toFixed(2)} MHz</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">FULL BANDWIDTH</div>
                        <div className="text-xl">{((results[activeTab].chirpFrequency.end - results[activeTab].chirpFrequency.start) * 1000).toFixed(2)} MHz</div>
                      </div>
                    </div>
                  </div>

                  {/* CHIRP Timing Parameters */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-300">CHIRP Timing Parameters</h3>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">DC POWER ON DELAY TIME</div>
                        <div className="text-xl">{results[activeTab].timing.dc_power_delay.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">DWELL TIME</div>
                        <div className="text-xl">{results[activeTab].timing.dwell.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">SETTLE TIME</div>
                        <div className="text-xl">{results[activeTab].timing.settle.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">ACQUISITION TIME</div>
                        <div className="text-xl">{results[activeTab].timing.acquisition.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">RESET TIME</div>
                        <div className="text-xl">{results[activeTab].timing.reset.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">JUMPBACK TIME</div>
                        <div className="text-xl">{results[activeTab].timing.jumpback.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">IDLE TIME</div>
                        <div className="text-xl">{results[activeTab].timing.idle.toFixed(2)} µs</div>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">CHIRP TIME</div>
                        <div className="text-xl">{results[activeTab].timing.chirp.toFixed(2)} µs</div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Parameters */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-2xl font-semibold mb-4 text-gray-300">Frame Parameters</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">Frame Time</div>
                          <div className="text-xl">{results[activeTab].frame.time.toFixed(2)} ms</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">Number of Chirps</div>
                          <div className="text-xl">{results[activeTab].frame.chirps}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold mb-4 text-gray-300">Minimum Number of Antennas</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">TX</div>
                          <div className="text-xl">{results[activeTab].antennas.tx}</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">RX</div>
                          <div className="text-xl">{results[activeTab].antennas.rx}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-2xl font-semibold mb-4 text-gray-300">Additional Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">Time of Flight</div>
                          <div className="text-xl">{results[activeTab].timeOfFlight.toFixed(2)} µs</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4">
                          <div className="text-gray-400 text-sm mb-1">Memory Required</div>
                          <div className="text-xl">{results[activeTab].memoryRequired.toFixed(2)} kilobits per frame</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IF Bandwidth Table */}
                  <div>
                    <h3 className="text-2xl font-semibold mb-4 text-gray-300">IF Bandwidth Table</h3>
                    <div className="bg-gray-700/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-2 text-gray-400">Chirp BW (MHz)</th>
                            <th className="text-left py-2 text-gray-400">Required IF BW (MHz)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results[activeTab].ifBandwidthTable.map((row: any, index: number) => (
                            <tr key={index} className="border-t border-gray-700">
                              <td className="py-2">{row.chirp_bw}</td>
                              <td className="py-2">{row.if_bandwidth.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 