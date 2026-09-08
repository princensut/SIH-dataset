import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  CloudUpload,
  FileText,
  Gauge,
  History,
  RefreshCw,
  Search,
  Wind,
  X,
} from "lucide-react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [file, setFile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [offset, setOffset] = useState(0);

  const LIMIT = 10;

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [search, category, offset]);

  async function loadDashboard() {
    setDashboardLoading(true);

    try {
      const response = await fetch(`${API_URL}/predictions/summary`);

      if (!response.ok) {
        throw new Error("Failed to load dashboard statistics.");
      }

      const data = await response.json();
      setSummary(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDashboardLoading(false);
    }
  }

  async function loadHistory() {
    try {
      const params = new URLSearchParams({
        limit: LIMIT,
        offset,
      });

      if (search) params.append("search", search);
      if (category) params.append("category", category);

      const response = await fetch(
        `${API_URL}/predictions?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to load prediction history.");
      }

      const data = await response.json();
      setHistory(data.predictions || []);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleFileChange(event) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    validateAndSetFile(selectedFile);
  }

  function handleDrop(event) {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files?.[0];

    if (!droppedFile) return;

    validateAndSetFile(droppedFile);
  }

  function validateAndSetFile(selectedFile) {
    setError("");
    setPrediction(null);

    const validExtensions = [".nc", ".nc4", ".netcdf"];
    const extension = selectedFile.name
      .substring(selectedFile.name.lastIndexOf("."))
      .toLowerCase();

    if (!validExtensions.includes(extension)) {
      setError("Please upload a NetCDF file (.nc, .nc4, or .netcdf).");
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File is too large. Maximum size is 50 MB.");
      return;
    }

    setFile(selectedFile);
  }

  async function predictCyclone() {
    if (!file) {
      setError("Please select a NetCDF satellite file first.");
      return;
    }

    setLoading(true);
    setError("");
    setPrediction(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail || data.error || "Prediction failed."
        );
      }

      setPrediction(data);

      await loadDashboard();
      await loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function clearFile() {
    setFile(null);
    setPrediction(null);
    setError("");
  }

  function getCategoryClass(categoryName) {
    if (!categoryName) return "";

    return categoryName
      .toLowerCase()
      .replaceAll(" ", "-");
  }

  const totalPages = summary
    ? Math.ceil(summary.total_predictions / LIMIT)
    : 0;

  const currentPage = Math.floor(offset / LIMIT) + 1;

  return (
    <div className="app">
      <header className="navbar">
        <div className="brand">
          <div className="brand-icon">
            <Activity size={23} />
          </div>

          <div>
            <h1>CYCLONE<span>AI</span></h1>
            <p>INTENSITY INTELLIGENCE SYSTEM</p>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot"></span>
          SYSTEM ONLINE
        </div>
      </header>

      <main>
        <section className="hero">
          <div>
            <div className="eyebrow">
              <span></span>
              SATELLITE INTELLIGENCE
            </div>

            <h2>
              Tropical Cyclone
              <br />
              <strong>Intensity Prediction</strong>
            </h2>

            <p className="hero-description">
              AI-powered estimation of cyclone wind speed and
              central pressure from satellite brightness-temperature
              observations.
            </p>
          </div>

          <div className="hero-orbit">
            <div className="orbit orbit-1"></div>
            <div className="orbit orbit-2"></div>
            <div className="orbit-core">
              <Wind size={42} />
            </div>
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button onClick={() => setError("")}>
              <X size={17} />
            </button>
          </div>
        )}

        <section className="workspace">
          <div className="upload-card panel">
            <div className="panel-heading">
              <div>
                <span className="section-number">01</span>
                <div>
                  <h3>Satellite Data</h3>
                  <p>Upload NetCDF observation</p>
                </div>
              </div>
            </div>

            <div
              className={`drop-zone ${file ? "has-file" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              {!file ? (
                <>
                  <div className="upload-icon">
                    <CloudUpload size={31} />
                  </div>

                  <h4>Drop satellite file here</h4>

                  <p>
                    or select a file from your computer
                  </p>

                  <label className="browse-button">
                    Browse Files
                    <input
                      type="file"
                      accept=".nc,.nc4,.netcdf"
                      onChange={handleFileChange}
                      hidden
                    />
                  </label>

                  <span className="file-hint">
                    NetCDF • MAX 50 MB
                  </span>
                </>
              ) : (
                <>
                  <div className="selected-file-icon">
                    <FileText size={28} />
                  </div>

                  <h4>{file.name}</h4>

                  <p>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>

                  <div className="file-actions">
                    <button
                      className="secondary-button"
                      onClick={clearFile}
                    >
                      Remove
                    </button>

                    <button
                      className="primary-button"
                      onClick={predictCyclone}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <RefreshCw
                            size={17}
                            className="spin"
                          />
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <Activity size={17} />
                          RUN PREDICTION
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="result-card panel">
            <div className="panel-heading">
              <div>
                <span className="section-number">02</span>
                <div>
                  <h3>Prediction</h3>
                  <p>AI model output</p>
                </div>
              </div>
            </div>

            {!prediction ? (
              <div className="empty-result">
                <Gauge size={39} />
                <h4>Awaiting observation</h4>
                <p>
                  Upload a NetCDF satellite file to generate
                  an intensity prediction.
                </p>
              </div>
            ) : (
              <div className="prediction-result">
                <div className="metrics">
                  <div className="metric">
                    <span>WIND SPEED</span>
                    <strong>
                      {prediction.prediction.wind_speed_kt.toFixed(1)}
                    </strong>
                    <small>KT</small>
                  </div>

                  <div className="metric-divider"></div>

                  <div className="metric">
                    <span>CENTRAL PRESSURE</span>
                    <strong>
                      {prediction.prediction.pressure_mb.toFixed(1)}
                    </strong>
                    <small>MB</small>
                  </div>
                </div>

                <div
                  className={`intensity ${getCategoryClass(
                    prediction.prediction.intensity_category
                  )}`}
                >
                  <span>CLASSIFICATION</span>
                  <strong>
                    {prediction.prediction.intensity_category}
                  </strong>
                </div>

                <div className="quality-row">
                  <div>
                    <span>TB VARIABLE</span>
                    <strong>
                      {prediction.input.tb_variable}
                    </strong>
                  </div>

                  <div>
                    <span>INPUT SIZE</span>
                    <strong>
                      {prediction.processing.model_input_size.join(
                        " × "
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>VALID DATA</span>
                    <strong>
                      {prediction.data_quality.valid_percentage.toFixed(
                        1
                      )}
                      %
                    </strong>
                  </div>

                  <div>
                    <span>PROCESSING</span>
                    <strong>
                      {prediction.processing.processing_time_seconds.toFixed(
                        2
                      )}
                      s
                    </strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="stats-section">
          <div className="section-title">
            <div>
              <span className="section-number">03</span>
              <div>
                <h3>System Overview</h3>
                <p>Prediction statistics</p>
              </div>
            </div>

            <button
              className="refresh-button"
              onClick={() => {
                loadDashboard();
                loadHistory();
              }}
            >
              <RefreshCw size={16} />
              REFRESH
            </button>
          </div>

          <div className="stats-grid">
            <StatCard
              icon={<BarChart3 />}
              label="TOTAL PREDICTIONS"
              value={
                dashboardLoading
                  ? "—"
                  : summary?.total_predictions ?? 0
              }
            />

            <StatCard
              icon={<Wind />}
              label="AVERAGE WIND"
              value={
                dashboardLoading
                  ? "—"
                  : `${summary?.average_wind_kt?.toFixed(1) ?? "—"} kt`
              }
            />

            <StatCard
              icon={<Gauge />}
              label="AVERAGE PRESSURE"
              value={
                dashboardLoading
                  ? "—"
                  : `${summary?.average_pressure_mb?.toFixed(1) ?? "—"} mb`
              }
            />

            <StatCard
              icon={<Activity />}
              label="MAXIMUM WIND"
              value={
                dashboardLoading
                  ? "—"
                  : `${summary?.maximum_wind_kt?.toFixed(1) ?? "—"} kt`
              }
            />
          </div>
        </section>

        <section className="history-section">
          <div className="section-title">
            <div>
              <span className="section-number">04</span>
              <div>
                <h3>Prediction History</h3>
                <p>Previously analyzed observations</p>
              </div>
            </div>
          </div>

          <div className="history-toolbar">
            <div className="search-box">
              <Search size={17} />
              <input
                placeholder="Search filename..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setOffset(0);
                }}
              />
            </div>

            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setOffset(0);
              }}
            >
              <option value="">All intensities</option>
              <option value="Below Depression">
                Below Depression
              </option>
              <option value="Depression">Depression</option>
              <option value="Deep Depression">
                Deep Depression
              </option>
              <option value="Cyclonic Storm">
                Cyclonic Storm
              </option>
              <option value="Severe Cyclonic Storm">
                Severe Cyclonic Storm
              </option>
              <option value="Very Severe Cyclonic Storm">
                Very Severe Cyclonic Storm
              </option>
              <option value="Extremely Severe Cyclonic Storm">
                Extremely Severe Cyclonic Storm
              </option>
              <option value="Super Cyclonic Storm">
                Super Cyclonic Storm
              </option>
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>FILE</th>
                  <th>WIND</th>
                  <th>PRESSURE</th>
                  <th>INTENSITY</th>
                  <th>DATA QUALITY</th>
                  <th>TIME</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      No predictions found.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.prediction_id}>
                      <td>
                        <div className="filename">
                          <FileText size={16} />
                          {item.filename}
                        </div>
                      </td>

                      <td>
                        <strong>
                          {item.wind_speed_kt.toFixed(1)}
                        </strong>{" "}
                        kt
                      </td>

                      <td>
                        {item.pressure_mb.toFixed(1)} mb
                      </td>

                      <td>
                        <span
                          className={`category-badge ${getCategoryClass(
                            item.intensity_category
                          )}`}
                        >
                          {item.intensity_category}
                        </span>
                      </td>

                      <td>
                        {item.valid_percentage != null
                          ? `${item.valid_percentage.toFixed(1)}%`
                          : "—"}
                      </td>

                      <td>
                        {new Date(
                          item.created_at
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={offset === 0}
                onClick={() =>
                  setOffset(Math.max(0, offset - LIMIT))
                }
              >
                PREVIOUS
              </button>

              <span>
                PAGE {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(offset + LIMIT)}
              >
                NEXT
              </button>
            </div>
          )}
        </section>
      </main>

      <footer>
        <span>CYCLONE AI</span>
        <span>AI-POWERED CYCLONE INTENSITY ESTIMATION</span>
        <span>FASTAPI + CNN</span>
      </footer>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>

      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default App;