(function missionControlDemo() {
  if (!window.THREE) {
    throw new Error("Three.js failed to load.");
  }

  const THREE = window.THREE;
  const PAGE_MODE = document.body.dataset.pageMode || "storyline";
  const SPEED_OF_LIGHT_M_PER_S = 299792458;
  const EARTH_RADIUS_KM = 6371;
  const EARTH_RADIUS_SCENE = 2.35;
  const ISS_NORAD_ID = 25544;
  const LIVE_POLL_INTERVAL_MS = 18000;
  const LIVE_TIMEOUT_MS = 4500;
  const N2YO_API_BASE = "https://api.n2yo.com/rest/v1/satellite";
  const N2YO_PASS_POLL_INTERVAL_MS = 20 * 60 * 1000;
  const N2YO_TIMEOUT_MS = 9000;
  const N2YO_PASS_LOOKAHEAD_DAYS = 3;
  const N2YO_MIN_ELEVATION_DEGREES = 5;
  const PHONE_MEDIA_QUERY = window.matchMedia ? window.matchMedia("(max-width: 700px)") : null;
  const ORBITSMITH_API_BASE = "https://orbitsmith-api.orbitsmith-space.workers.dev";
  const ORBITSMITH_POLL_INTERVAL_MS = 5 * 60 * 1000;
  const ORBITSMITH_TIMEOUT_MS = 8000;
  const ORBIT_PERIOD_SECONDS = 5560;
  const ORBITSMITH_FALLBACK_SNAPSHOT = {
    trackedObjects: 30629,
    satellites: 17205,
    rocketBodies: 2192,
    debris: 10069,
    unknown: 1163,
    leoObjects: 30629,
    activeConjunctions24h: 48,
    riskCritical: 3,
    riskHigh: 34,
    riskModerate: 7,
    riskLow: 4,
    riskNoPc: 0,
    upcomingReentries: 10,
    source: "Space-Track snapshot via OrbitSmith",
    updatedIso: "2026-04-07T14:18:57.050Z",
    issTleLine1: "",
    issTleLine2: "",
  };
  const ORBITSMITH_COLORS = {
    catalog: {
      satellites: "#00bd7b",
      rocketBodies: "#d3a228",
      debris: "#f05a64",
      unknown: "#717d93",
    },
    risk: {
      critical: "#f04f62",
      high: "#d39d20",
      moderate: "#3cc0f0",
      low: "#4bc09a",
      noPc: "#5f6b80",
    },
  };
  const LEOLABS_METRICS_URLS = [
    "https://platform.leolabs.space/system_metrics",
    "https://api.leolabs.space/system_metrics",
  ];
  const LEOLABS_POLL_INTERVAL_MS = 10 * 60 * 1000;
  const LEOLABS_TIMEOUT_MS = 7000;
  const LEOLABS_FALLBACK_SNAPSHOT = {
    objects: 27230,
    latencyMinutes: 2,
    accuracyMeters: 25,
    precisionMeters: 17,
    radarPasses: 4903152,
    measurements: 99864415,
    stateVectors: 5044524,
    screenings: 1738889,
    source: "LeoLabs System Metrics",
    updatedIso: "2026-04-17T00:00:00.000Z",
  };
  const LEOLABS_COVERAGE_REFERENCE = {
    residentObjectsApprox: 25000,
    catalogCoveragePct: 99.3,
    satelliteCoveragePct: 99.96,
    debrisCoveragePct: 98.56,
    source: "LeoLabs press release (Dec 9, 2025)",
  };
  const LEOLABS_HISTORY_POINTS = [
    {
      label: "Aug 2025",
      objects: 24565,
      measurements: 88609361,
    },
    {
      label: "Feb 2026",
      objects: 26520,
      measurements: 95172830,
    },
    {
      label: "Apr 2026",
      objects: 27230,
      measurements: 99864415,
    },
  ];
  const EARTH_TEXTURES = {
    day: {
      remote: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg",
      local: "./assets/textures/earth_atmos_2048.jpg",
    },
    normal: {
      remote: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg",
      local: "./assets/textures/earth_normal_2048.jpg",
    },
    specular: {
      remote: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg",
      local: "./assets/textures/earth_specular_2048.jpg",
    },
    clouds: {
      remote: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_clouds_1024.png",
      local: "./assets/textures/earth_clouds_1024.png",
    },
    lights: {
      remote: "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_lights_2048.png",
      local: "./assets/textures/earth_lights_2048.png",
    },
  };
  const SAUDI_LOCATOR = {
    lat: 23.9,
    lon: 45.1,
    altMeters: 22000,
  };
  const SAUDI_REGION_POLYGON = [
    [31.6, 34.4],
    [31.1, 36.2],
    [31.6, 39.1],
    [30.8, 42.4],
    [30.2, 45.0],
    [28.8, 48.3],
    [26.6, 50.0],
    [24.5, 50.1],
    [22.5, 51.3],
    [20.5, 52.4],
    [18.4, 54.2],
    [16.6, 54.7],
    [16.3, 52.6],
    [16.6, 50.4],
    [16.8, 47.7],
    [17.0, 45.8],
    [17.2, 43.8],
    [17.3, 42.0],
    [16.3, 41.8],
    [16.6, 39.7],
    [17.6, 37.9],
    [19.0, 36.7],
    [20.8, 35.1],
    [22.3, 36.3],
    [24.6, 37.3],
    [26.4, 36.8],
    [28.2, 36.1],
    [29.8, 35.1],
    [31.1, 34.6],
  ];
  const LEO_ALTITUDE_BANDS = [
    { minKm: 340, maxKm: 460, weight: 0.13 },
    { minKm: 500, maxKm: 620, weight: 0.41 },
    { minKm: 690, maxKm: 900, weight: 0.24 },
    { minKm: 1080, maxKm: 1350, weight: 0.15 },
    { minKm: 1400, maxKm: 1900, weight: 0.07 },
  ];
  const LEO_INCLINATIONS = [
    { degrees: 53.2, weight: 0.34 },
    { degrees: 97.6, weight: 0.29 },
    { degrees: 70.0, weight: 0.12 },
    { degrees: 74.0, weight: 0.1 },
    { degrees: 51.6, weight: 0.09 },
    { degrees: 86.4, weight: 0.06 },
  ];

  /**
   * @typedef {Object} SiteConfig
   * @property {string} id
   * @property {string} name
   * @property {string} role
   * @property {number} lat
   * @property {number} lon
   * @property {number} altMeters
   * @property {string} displayColor
   */

  /**
   * @typedef {Object} TargetState
   * @property {number} timestamp
   * @property {number} lat
   * @property {number} lon
   * @property {number} altMeters
   * @property {number | undefined} velocityKmS
   */

  /**
   * @typedef {Object} MetricsModel
   * @property {number} baselineKm
   * @property {number} txToIssKm
   * @property {number} issToRxKm
   * @property {number} totalPathKm
   * @property {number} excessPathKm
   * @property {number} delayMicroseconds
   * @property {Record<string, string>} labels
   */

  // Coordinates are taken from the SUPR-LEO study tables for the selected demo pair.
  /** @type {SiteConfig[]} */
  const SITE_CONFIGS = [
    {
      id: "rx",
      name: "PNU Radio Telescope",
      role: "Receiving node",
      lat: 24.856155,
      lon: 46.72139,
      altMeters: 620,
      displayColor: "#63d5ff",
    },
    {
      id: "tx",
      name: "Riyadh TV Tower",
      role: "Illuminating transmitter",
      lat: 24.64322,
      lon: 46.696,
      altMeters: 780,
      displayColor: "#ffb95d",
    },
  ];

  const CONTENT_SECTIONS = {
    overview: {
      title: "Overview",
      open: true,
      paragraphs: [
        "This demonstration scene introduces Saudi Urban Passive Radar for LEO Debris Detection (SUPR-LEO), a passive radar concept for observing activity in low Earth orbit by pairing a terrestrial broadcast source with a receiving telescope.",
        "Use this section for the final research-backed project summary, problem framing, and system-level explanation tailored to reviewers or judges.",
      ],
      bullets: [
        "Narrate the end-to-end signal path from illuminator to space object to receiver.",
        "Replace placeholder wording with your validated research summary and system architecture.",
      ],
    },
    math: {
      title: "Passive Radar Math",
      open: true,
      paragraphs: [
        "The dashboard displays geometry-backed quantities only: baseline, bistatic legs, total path length, excess path, and propagation delay.",
        "Equation cards below stay intentionally general until exact transmitter power, gain, bandwidth, noise, and RCS assumptions are finalized.",
      ],
      formulas: [
        {
          code: "R_bi = |r_TX - r_target| + |r_target - r_RX|",
          text: "Bistatic path length is the sum of the transmitter-to-target and target-to-receiver slant ranges.",
        },
        {
          code: "Delta R = R_bi - |r_TX - r_RX|",
          text: "Excess path isolates the additional distance introduced by the reflected route relative to the direct baseline.",
        },
        {
          code: "tau = (Delta R x 1000) / c",
          text: "Propagation delay converts the excess distance in kilometers into time-of-arrival offset using the speed of light.",
        },
        {
          code: "f_D = (1 / lambda) * d(R_bi)/dt",
          text: "Use Doppler shift later when you want to extend the demo toward relative radial velocity and detection processing.",
        },
      ],
    },
    surveillance: {
      title: "Why Space Surveillance",
      open: false,
      paragraphs: [
        "Space surveillance is required to understand what is in orbit, how objects move, and when their paths create risk for active missions or critical services.",
        "This section is intended for your mission-value narrative: protecting national infrastructure, supporting situational awareness, and enabling early warning.",
      ],
      bullets: [
        "Describe the operational need for persistent monitoring of LEO activity.",
        "Add examples that connect surveillance capability to resilience, safety, and decision support.",
      ],
    },
    debris: {
      title: "LEO Congestion",
      open: false,
      paragraphs: [
        "Low Earth orbit is increasingly crowded with operational satellites, inactive spacecraft, fragmentation debris, and close conjunction events.",
        "This placeholder copy should be replaced with your sourced statistics, collision-risk framing, and debris-growth trend discussion.",
      ],
      bullets: [
        "Insert current debris population figures from your selected references.",
        "Explain why passive sensing and scalable monitoring concepts matter as orbit traffic grows.",
      ],
    },
    aims: {
      title: "Project Aims",
      open: false,
      paragraphs: [
        "SUPR-LEO aims to demonstrate how a passive radar configuration can support space-object surveillance using existing emitters and a dedicated receiving node.",
        "Use this space for your objectives, expected contributions, and research roadmap.",
      ],
      bullets: [
        "State the sensing concept, intended capability, and evaluation scope.",
        "Clarify what the first prototype proves and what future work will add.",
      ],
    },
    references: {
      title: "References",
      open: false,
      paragraphs: [
        "Replace these placeholders with your final research sources, example websites, and any standards or reports you cite during the presentation.",
      ],
      bullets: [
        "ISS API for optional live target updates: wheretheiss.at",
        "Ground-node positions and site descriptions for the PNU receiving site and Riyadh TV Tower transmitter",
        "LEO debris and surveillance references from your literature review",
      ],
    },
  };

  const FOCUS_CONTENT = {
    rx: {
      role: "Receiving node",
      description:
        "The RX node listens for reflected energy and anchors the receiving end of the bistatic geometry. In your final narrative, use this panel to describe aperture, sensitivity, and receive-chain assumptions.",
      bullets: [
        "Tracks the reflected leg from the ISS back to the receiver.",
        "Pairs with the broadcaster to form the bistatic baseline.",
      ],
    },
    tx: {
      role: "Broadcast illuminator",
      description:
        "The TX node represents a non-cooperative illuminator of opportunity. It provides the outbound signal that can be reflected by an object in orbit and observed by the receiver.",
      bullets: [
        "Defines the outbound leg of the passive radar path.",
        "Can later be extended with power, frequency, and waveform assumptions.",
      ],
    },
    iss: {
      role: "Tracked object",
      description:
        "The ISS is used here as a demonstration target in low Earth orbit. The dashboard updates the bistatic geometry continuously as its position changes in live or scripted mode.",
      bullets: [
        "Illustrates the surveillance target and reflected path geometry.",
        "Provides a clear stand-in for future debris or resident-space-object tracking scenarios.",
      ],
    },
  };

  const STORY_STEPS = [
    {
      id: "baseline",
      title: "Step 1 - Ground Baseline Over Riyadh",
      description:
        "This opening view shows the receiver and transmitter on the ground, establishing the passive radar baseline between the PNU telescope and the Riyadh TV Tower.",
      selection: "tx",
      panelKey: "overview",
      camera: {
        azimuth: degreesToRadians(46),
        polar: degreesToRadians(66),
        distance: 5.55,
      },
    },
    {
      id: "bistatic",
      title: "Step 2 - Bistatic Detection Geometry",
      description:
        "The scene now emphasizes the two signal legs that define the reflected path: transmitter to target and target to receiver. These distances feed the bistatic range calculations shown on the right.",
      selection: "iss",
      panelKey: "math",
      camera: {
        azimuth: degreesToRadians(59),
        polar: degreesToRadians(63),
        distance: 6.18,
      },
    },
    {
      id: "target",
      title: "Step 3 - ISS Surveillance View",
      description:
        "This view reframes the scene around the object in orbit, showing how a passive radar concept could support space surveillance of known targets and later expand toward debris monitoring.",
      selection: "iss",
      panelKey: "surveillance",
      camera: {
        azimuth: degreesToRadians(76),
        polar: degreesToRadians(55),
        distance: 7.35,
      },
    },
    {
      id: "debris",
      title: "Step 4 - LEO Congestion Context",
      description:
        "The wider orbit layer highlights the broader motivation: crowded low Earth orbit, growing debris populations, and the need for scalable surveillance concepts that support situational awareness.",
      selection: "iss",
      panelKey: "debris",
      camera: {
        azimuth: degreesToRadians(30),
        polar: degreesToRadians(47),
        distance: 8.75,
      },
    },
  ];

  const LABEL_OFFSETS = {
    rx: { x: -90, y: -88 },
    tx: { x: 92, y: -80 },
    iss: { x: 0, y: -62 },
    baseline: { x: 0, y: 56 },
    txIss: { x: 0, y: -30 },
    issRx: { x: 0, y: 48 },
  };

  const SECTION_TO_STORY_INDEX = {
    overview: 0,
    math: 1,
    surveillance: 2,
    debris: 3,
  };

  const refs = {
    sceneMount: document.getElementById("sceneMount"),
    overlayLabelLayer: document.getElementById("overlayLabelLayer"),
    modeBadge: document.getElementById("modeBadge"),
    storyBadge: document.getElementById("storyBadge"),
    selectionBadge: document.getElementById("selectionBadge"),
    storyCard: document.getElementById("storyCard"),
    storyStepTag: document.getElementById("storyStepTag"),
    storyTitle: document.getElementById("storyTitle"),
    storyDescription: document.getElementById("storyDescription"),
    storyProgress: document.getElementById("storyProgress"),
    nextStoryButton: document.getElementById("nextStoryButton"),
    skipStoryButton: document.getElementById("skipStoryButton"),
    restartStoryButton: document.getElementById("restartStoryButton"),
    playPauseButton: document.getElementById("playPauseButton"),
    focusIssButton: document.getElementById("focusIssButton"),
    resetViewButton: document.getElementById("resetViewButton"),
    retryLiveButton: document.getElementById("retryLiveButton"),
    toggleRx: document.getElementById("toggleRx"),
    toggleTx: document.getElementById("toggleTx"),
    toggleGrid: document.getElementById("toggleGrid"),
    toggleOrbit: document.getElementById("toggleOrbit"),
    toggleDebris: document.getElementById("toggleDebris"),
    toggleLinks: document.getElementById("toggleLinks"),
    tickerTrack: document.getElementById("tickerTrack"),
    tickerStatus: document.getElementById("tickerStatus"),
    heroBaselineValue: document.getElementById("heroBaselineValue"),
    heroPathValue: document.getElementById("heroPathValue"),
    heroDelayValue: document.getElementById("heroDelayValue"),
    heroModeValue: document.getElementById("heroModeValue"),
    metricsGrid: document.getElementById("metricsGrid"),
    metricsModeTag: document.getElementById("metricsModeTag"),
    focusCard: document.getElementById("focusCard"),
    focusRoleTag: document.getElementById("focusRoleTag"),
    snapshotSelection: document.getElementById("snapshotSelection"),
    snapshotNarrative: document.getElementById("snapshotNarrative"),
    contentSections: document.getElementById("contentSections"),
    leoFeedTag: document.getElementById("leoFeedTag"),
    leoTrackedValue: document.getElementById("leoTrackedValue"),
    leoLeoBandValue: document.getElementById("leoLeoBandValue"),
    leoDebrisValue: document.getElementById("leoDebrisValue"),
    leoConjunctionValue: document.getElementById("leoConjunctionValue"),
    leoCriticalValue: document.getElementById("leoCriticalValue"),
    leoReentryValue: document.getElementById("leoReentryValue"),
    leolabsObjectsValue: document.getElementById("leolabsObjectsValue"),
    leolabsLatencyValue: document.getElementById("leolabsLatencyValue"),
    leolabsAccuracyValue: document.getElementById("leolabsAccuracyValue"),
    leolabsPrecisionValue: document.getElementById("leolabsPrecisionValue"),
    leoCatalogDonut: document.getElementById("leoCatalogDonut"),
    leoCatalogCenter: document.getElementById("leoCatalogCenter"),
    leoCatalogLegend: document.getElementById("leoCatalogLegend"),
    leoRiskDonut: document.getElementById("leoRiskDonut"),
    leoRiskCenter: document.getElementById("leoRiskCenter"),
    leoRiskLegend: document.getElementById("leoRiskLegend"),
    leoTrendSvg: document.getElementById("leoTrendSvg"),
    leoTrendDelta: document.getElementById("leoTrendDelta"),
    leoTrendCaption: document.getElementById("leoTrendCaption"),
    leolabsPerfBars: document.getElementById("leolabsPerfBars"),
    leolabsCoverageBadges: document.getElementById("leolabsCoverageBadges"),
    leoDashboardMeta: document.getElementById("leoDashboardMeta"),
    issTleLine1: document.getElementById("issTleLine1"),
    issTleLine2: document.getElementById("issTleLine2"),
    leoSourceMeta: document.getElementById("leoSourceMeta"),
    focusDetails: document.getElementById("focusDetails"),
    passStatusValue: document.getElementById("passStatusValue"),
    timeToClosestPassValue: document.getElementById("timeToClosestPassValue"),
    passProgressFill: document.getElementById("passProgressFill"),
    issAltitudeValue: document.getElementById("issAltitudeValue"),
    issSpeedValue: document.getElementById("issSpeedValue"),
    passWindowValue: document.getElementById("passWindowValue"),
    n2yoMaxElevationValue: document.getElementById("n2yoMaxElevationValue"),
    n2yoPassAzimuthValue: document.getElementById("n2yoPassAzimuthValue"),
    n2yoPassSourceValue: document.getElementById("n2yoPassSourceValue"),
    dashboardBaselineValue: document.getElementById("dashboardBaselineValue"),
    dashboardTxTargetValue: document.getElementById("dashboardTxTargetValue"),
    dashboardTargetRxValue: document.getElementById("dashboardTargetRxValue"),
    dashboardBistaticValue: document.getElementById("dashboardBistaticValue"),
    dashboardDelayValue: document.getElementById("dashboardDelayValue"),
    dashboardBistaticAngleValue: document.getElementById("dashboardBistaticAngleValue"),
    opportunityGaugeFill: document.getElementById("opportunityGaugeFill"),
    opportunityGaugeValue: document.getElementById("opportunityGaugeValue"),
    dopplerEstimateValue: document.getElementById("dopplerEstimateValue"),
    geometryQualityValue: document.getElementById("geometryQualityValue"),
    rangeResolutionValue: document.getElementById("rangeResolutionValue"),
    coherentProcessingValue: document.getElementById("coherentProcessingValue"),
    txNodeCoords: document.getElementById("txNodeCoords"),
    txNodeBand: document.getElementById("txNodeBand"),
    txNodeSignal: document.getElementById("txNodeSignal"),
    txNodeRole: document.getElementById("txNodeRole"),
    rxNodeCoords: document.getElementById("rxNodeCoords"),
    rxNodeAperture: document.getElementById("rxNodeAperture"),
    rxNodeBandwidth: document.getElementById("rxNodeBandwidth"),
    rxNodeRole: document.getElementById("rxNodeRole"),
  };

  const appState = {
    liveMode: "connecting",
    liveFailureReason: "",
    nextLivePollAt: 0,
    simulationPaused: false,
    storyMode: true,
    storyIndex: 0,
    selectedEntity: "iss",
    visibleSection: "overview",
    layers: {
      rx: true,
      tx: true,
      grid: true,
      orbit: true,
      debris: true,
      links: true,
    },
    cameraCurrent: {
      azimuth: STORY_STEPS[0].camera.azimuth,
      polar: STORY_STEPS[0].camera.polar,
      distance: STORY_STEPS[0].camera.distance,
    },
    cameraTarget: {
      azimuth: STORY_STEPS[0].camera.azimuth,
      polar: STORY_STEPS[0].camera.polar,
      distance: STORY_STEPS[0].camera.distance,
    },
    drag: {
      active: false,
      pointerId: null,
      lastX: 0,
      lastY: 0,
    },
    raycastPointer: new THREE.Vector2(),
    currentMetrics: null,
    lastFrameTime: performance.now(),
    simSeconds: 0,
    liveTargetState: null,
    displayedIssState: null,
    orbitsmithSnapshot: { ...ORBITSMITH_FALLBACK_SNAPSHOT },
    orbitsmithMode: "fallback",
    orbitsmithError: "",
    nextOrbitsmithPollAt: 0,
    leolabsSnapshot: { ...LEOLABS_FALLBACK_SNAPSHOT },
    leolabsMode: "fallback",
    leolabsError: "",
    nextLeolabsPollAt: 0,
    dashboardPassEstimate: null,
    n2yoPassSnapshot: null,
    n2yoMode: "missing-key",
    n2yoError: "",
    nextN2yoPollAt: 0,
    markers: {},
    overlayLabels: {},
  };

  const sceneObjects = {
    renderer: null,
    scene: null,
    camera: null,
    raycaster: new THREE.Raycaster(),
    globeMesh: null,
    globeMaterial: null,
    atmosphereMesh: null,
    cloudsMesh: null,
    cloudsMaterial: null,
    lightsMesh: null,
    lightsMaterial: null,
    saudiLocator: null,
    saudiRing: null,
    saudiPulse: null,
    stars: null,
    gridGroup: null,
    orbitLine: null,
    debrisCloud: null,
    debrisSpecks: null,
    debrisPieces: [],
    debrisShells: [],
    saudiRegionFill: null,
    saudiRegionOutline: null,
    directLine: null,
    txIssLine: null,
    issRxLine: null,
    interactiveMeshes: [],
    earthGroup: new THREE.Group(),
  };

  init();

  function init() {
    renderContentSections();
    createOverlayLabels();
    renderStoryProgress();
    initScene();
    bindUi();
    updateStoryStep(0, true);
    if (PAGE_MODE === "visualizer") {
      enterExploreMode();
      setSelection("tx");
      const baselineView = resolveStoryCamera(STORY_STEPS[0]);
      baselineView.distance = 5.18;
      setCameraTarget(baselineView, true);
    } else if (PAGE_MODE === "dashboard") {
      enterExploreMode();
      setSelection("iss");
      setCameraTarget(
        {
          azimuth: degreesToRadians(52),
          polar: degreesToRadians(63),
          distance: 6.35,
        },
        true
      );
    }
    updateHeroMetrics(null);
    updateTelemetryRibbon();
    updateLeoDataPanel();
    updateFocusPanel();
    syncLayerVisibility();
    syncModeIndicators();
    requestLiveIssData(true);
    requestN2yoPassData(true);
    requestOrbitsmithData(true);
    requestLeoLabsData(true);
    window.addEventListener("resize", onResize);
    onResize();
    requestAnimationFrame(animate);
  }

  function renderContentSections() {
    refs.contentSections.innerHTML = Object.entries(CONTENT_SECTIONS)
      .map(([key, section]) => {
        const paragraphs = section.paragraphs
          .map((paragraph) => `<p>${paragraph}</p>`)
          .join("");
        const bullets = section.bullets
          ? `<ul>${section.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`
          : "";
        const formulas = section.formulas
          ? section.formulas
              .map(
                (formula) => `
                  <div class="formula-block">
                    <code>${formula.code}</code>
                    <p>${formula.text}</p>
                  </div>
                `
              )
              .join("")
          : "";

        return `
          <details class="info-section" data-section="${key}" ${section.open ? "open" : ""}>
            <summary>${section.title}</summary>
            <div class="info-section__body">
              ${paragraphs}
              ${bullets}
              ${formulas}
            </div>
          </details>
        `;
      })
      .join("");
  }

  function createOverlayLabels() {
    const labels = [
      { id: "rx", cssClass: "screen-tag screen-tag--rx" },
      { id: "tx", cssClass: "screen-tag screen-tag--tx" },
      { id: "iss", cssClass: "screen-tag screen-tag--iss" },
      { id: "baseline", cssClass: "screen-tag screen-tag--line screen-tag--baseline" },
      { id: "txIss", cssClass: "screen-tag screen-tag--line screen-tag--txiss" },
      { id: "issRx", cssClass: "screen-tag screen-tag--line screen-tag--issrx" },
    ];

    labels.forEach((label) => {
      const element = document.createElement("div");
      element.className = label.cssClass;
      element.hidden = true;
      refs.overlayLabelLayer.appendChild(element);
      appState.overlayLabels[label.id] = element;
    });
  }

  function bindUi() {
    document.querySelectorAll("[data-section-link]").forEach((button) => {
      button.addEventListener("click", () => {
        navigateToSection(button.dataset.sectionLink);
      });
    });

    refs.storyProgress.addEventListener("click", (event) => {
      const button = event.target.closest("[data-story-index]");
      if (!button) {
        return;
      }

      updateStoryStep(Number(button.dataset.storyIndex));
    });

    refs.nextStoryButton.addEventListener("click", () => {
      if (appState.storyIndex >= STORY_STEPS.length - 1) {
        enterExploreMode();
        return;
      }

      updateStoryStep(appState.storyIndex + 1);
    });

    refs.skipStoryButton.addEventListener("click", enterExploreMode);
    refs.restartStoryButton.addEventListener("click", restartStory);

    refs.playPauseButton.addEventListener("click", () => {
      appState.simulationPaused = !appState.simulationPaused;
      refs.playPauseButton.textContent = appState.simulationPaused ? "Resume Orbit" : "Pause Orbit";
    });

    refs.focusIssButton.addEventListener("click", () => {
      setSelection("iss");
      focusOnEntity("iss");
    });

    refs.resetViewButton.addEventListener("click", () => {
      if (appState.storyMode) {
        updateStoryStep(appState.storyIndex, true);
      } else {
        setCameraTarget({
          azimuth: degreesToRadians(48),
          polar: degreesToRadians(62),
          distance: 7,
        });
      }
    });

    refs.retryLiveButton.addEventListener("click", () => {
      requestLiveIssData(true);
      requestN2yoPassData(true);
    });

    if (refs.toggleRx) {
      refs.toggleRx.addEventListener("change", (event) => {
        appState.layers.rx = event.target.checked;
        syncLayerVisibility();
      });
    }

    if (refs.toggleTx) {
      refs.toggleTx.addEventListener("change", (event) => {
        appState.layers.tx = event.target.checked;
        syncLayerVisibility();
      });
    }

    refs.toggleGrid.addEventListener("change", (event) => {
      appState.layers.grid = event.target.checked;
      syncLayerVisibility();
    });

    refs.toggleOrbit.addEventListener("change", (event) => {
      appState.layers.orbit = event.target.checked;
      syncLayerVisibility();
    });

    refs.toggleDebris.addEventListener("change", (event) => {
      appState.layers.debris = event.target.checked;
      syncLayerVisibility();
    });

    refs.toggleLinks.addEventListener("change", (event) => {
      appState.layers.links = event.target.checked;
      syncLayerVisibility();
    });

    refs.contentSections.querySelectorAll(".info-section").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (details.open) {
          appState.visibleSection = details.dataset.section;
          updateSectionNav();
        }
      });
    });
  }

  function renderStoryProgress() {
    refs.storyProgress.innerHTML = STORY_STEPS.map((step, index) => {
      const title = step.title.replace(/^Step \d+ - /, "");
      return `
        <button class="story-step-button" type="button" data-story-index="${index}">
          <span>Scene ${index + 1}</span>
          <strong>${title}</strong>
          <p>${step.description}</p>
        </button>
      `;
    }).join("");
  }

  function navigateToSection(sectionKey) {
    if (Object.prototype.hasOwnProperty.call(SECTION_TO_STORY_INDEX, sectionKey)) {
      updateStoryStep(SECTION_TO_STORY_INDEX[sectionKey]);
      return;
    }

    enterExploreMode();
    openContentSection(sectionKey);
    updateTelemetryRibbon();
  }

  function initScene() {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(getScenePixelRatio());
    if ("outputColorSpace" in renderer) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    }
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.92;
    renderer.setClearColor(0x030a14, 1);
    refs.sceneMount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);

    scene.add(sceneObjects.earthGroup);
    scene.background = new THREE.Color(0x030a14);
    scene.fog = new THREE.FogExp2(0x040c15, 0.0028);

    sceneObjects.renderer = renderer;
    sceneObjects.scene = scene;
    sceneObjects.camera = camera;

    addLighting();
    addStars();
    addEarth();
    addGroundGrid();
    addOrbitTrace();
    addDebrisCloud();
    addSiteMarkers();
    addIssMarker();
    addPathLines();
    attachPointerControls();
  }

  function addLighting() {
    const ambient = new THREE.AmbientLight(0x9acff1, 0.34);
    const hemi = new THREE.HemisphereLight(0x96deff, 0x081521, 0.54);
    const key = new THREE.DirectionalLight(0xffffff, 1.06);
    key.position.set(7, 5, 6);
    const fill = new THREE.DirectionalLight(0x84b7ff, 0.36);
    fill.position.set(-8, -2, -5);
    sceneObjects.scene.add(ambient, hemi, key, fill);
  }

  function addStars() {
    const geometry = new THREE.BufferGeometry();
    const starCount = isPhoneViewport() ? 850 : 1800;
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let index = 0; index < starCount; index += 1) {
      const radius = THREE.MathUtils.randFloat(18, 42);
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);

      positions[index * 3] = x;
      positions[index * 3 + 1] = y;
      positions[index * 3 + 2] = z;

      const tint = THREE.MathUtils.randFloat(0.78, 1);
      colors[index * 3] = tint;
      colors[index * 3 + 1] = tint;
      colors[index * 3 + 2] = 1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.075,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });

    sceneObjects.stars = new THREE.Points(geometry, material);
    sceneObjects.scene.add(sceneObjects.stars);
  }

  function addEarth() {
    const globeGeometry = new THREE.SphereGeometry(EARTH_RADIUS_SCENE, 96, 96);
    const globeMaterial = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      emissive: 0x0d1d2f,
      emissiveIntensity: 0.1,
      map: createEarthTexture(),
      shininess: 20,
      specular: new THREE.Color(0x7a90aa),
    });
    sceneObjects.globeMaterial = globeMaterial;

    sceneObjects.globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
    sceneObjects.earthGroup.add(sceneObjects.globeMesh);

    const lightsGeometry = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.001, 96, 96);
    sceneObjects.lightsMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd08f,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    sceneObjects.lightsMesh = new THREE.Mesh(lightsGeometry, sceneObjects.lightsMaterial);
    sceneObjects.earthGroup.add(sceneObjects.lightsMesh);

    const cloudsGeometry = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.015, 96, 96);
    sceneObjects.cloudsMaterial = new THREE.MeshPhongMaterial({
      color: 0xf5fbff,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
    });
    sceneObjects.cloudsMesh = new THREE.Mesh(cloudsGeometry, sceneObjects.cloudsMaterial);
    sceneObjects.earthGroup.add(sceneObjects.cloudsMesh);

    const atmosphereGeometry = new THREE.SphereGeometry(EARTH_RADIUS_SCENE * 1.03, 72, 72);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0x4ea8d0) },
        cameraVector: { value: new THREE.Vector3(0, 0, 7) },
      },
      vertexShader: `
        uniform vec3 cameraVector;
        varying float intensity;
        void main() {
          vec3 actualNormal = normalize(normalMatrix * normal);
          vec3 viewDirection = normalize(normalMatrix * cameraVector);
          intensity = pow(max(0.0, 0.8 - dot(actualNormal, viewDirection)), 5.2);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          gl_FragColor = vec4(glowColor, intensity * 0.06);
        }
      `,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    sceneObjects.atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    sceneObjects.earthGroup.add(sceneObjects.atmosphereMesh);

    addSaudiLocator();
    addSaudiRegionOverlay();
    loadEarthTextureSet();
  }

  function addSaudiLocator() {
    const anchor = latLonAltToVector3(SAUDI_LOCATOR.lat, SAUDI_LOCATOR.lon, SAUDI_LOCATOR.altMeters);
    const outward = anchor.clone().normalize();

    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(0.32, 44),
      new THREE.MeshBasicMaterial({
        color: 0x7ef6c7,
        transparent: true,
        opacity: 0.24,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    glow.position.copy(anchor);
    glow.lookAt(anchor.clone().add(outward));

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.29, 0.35, 64),
      new THREE.MeshBasicMaterial({
        color: 0x8dffe6,
        transparent: true,
        opacity: 0.84,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.position.copy(anchor.clone().add(outward.clone().multiplyScalar(0.001)));
    ring.lookAt(anchor.clone().add(outward));

    const pulse = new THREE.Mesh(
      new THREE.RingGeometry(0.37, 0.41, 64),
      new THREE.MeshBasicMaterial({
        color: 0x7ef6c7,
        transparent: true,
        opacity: 0.56,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    pulse.position.copy(anchor.clone().add(outward.clone().multiplyScalar(0.002)));
    pulse.lookAt(anchor.clone().add(outward));

    sceneObjects.earthGroup.add(glow, ring, pulse);
    sceneObjects.saudiLocator = glow;
    sceneObjects.saudiRing = ring;
    sceneObjects.saudiPulse = pulse;
  }

  function addSaudiRegionOverlay() {
    const regionAltitudeMeters = 18000;
    const regionPoints = SAUDI_REGION_POLYGON.map(([lat, lon]) =>
      latLonAltToVector3(lat, lon, regionAltitudeMeters)
    );
    if (regionPoints.length < 3) {
      return;
    }

    const centroid = regionPoints
      .reduce((accumulator, point) => accumulator.add(point), new THREE.Vector3())
      .multiplyScalar(1 / regionPoints.length)
      .normalize()
      .multiplyScalar(kilometersToSceneRadius(regionAltitudeMeters / 1000));

    const fillPositions = [];
    for (let index = 0; index < regionPoints.length; index += 1) {
      const current = regionPoints[index];
      const next = regionPoints[(index + 1) % regionPoints.length];
      fillPositions.push(
        centroid.x,
        centroid.y,
        centroid.z,
        current.x,
        current.y,
        current.z,
        next.x,
        next.y,
        next.z
      );
    }

    const fillGeometry = new THREE.BufferGeometry();
    fillGeometry.setAttribute("position", new THREE.Float32BufferAttribute(fillPositions, 3));
    fillGeometry.computeVertexNormals();

    const fillMesh = new THREE.Mesh(
      fillGeometry,
      new THREE.MeshBasicMaterial({
        color: 0x34d9ab,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    fillMesh.renderOrder = 1;

    const outline = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([...regionPoints, regionPoints[0]]),
      new THREE.LineBasicMaterial({
        color: 0x9fffe8,
        transparent: true,
        opacity: 0.95,
      })
    );

    sceneObjects.earthGroup.add(fillMesh, outline);
    sceneObjects.saudiRegionFill = fillMesh;
    sceneObjects.saudiRegionOutline = outline;
  }

  function loadEarthTextureSet() {
    const loader = new THREE.TextureLoader();
    const maxAnisotropy = sceneObjects.renderer.capabilities.getMaxAnisotropy();
    const load = (sources, onLoad) => {
      const paths = [sources.remote, sources.local].filter(Boolean);
      const tryLoad = (index) => {
        if (index >= paths.length) {
          return;
        }

        loader.load(
          paths[index],
          (texture) => {
            texture.anisotropy = maxAnisotropy;
            onLoad(texture);
          },
          undefined,
          () => {
            tryLoad(index + 1);
          }
        );
      };
      tryLoad(0);
    };

    load(EARTH_TEXTURES.day, (texture) => {
      if ("colorSpace" in texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      sceneObjects.globeMaterial.map = texture;
      sceneObjects.globeMaterial.needsUpdate = true;
    });

    load(EARTH_TEXTURES.normal, (texture) => {
      sceneObjects.globeMaterial.normalMap = texture;
      sceneObjects.globeMaterial.normalScale = new THREE.Vector2(0.85, 0.85);
      sceneObjects.globeMaterial.needsUpdate = true;
    });

    load(EARTH_TEXTURES.specular, (texture) => {
      sceneObjects.globeMaterial.specularMap = texture;
      sceneObjects.globeMaterial.specular = new THREE.Color(0x6d8098);
      sceneObjects.globeMaterial.needsUpdate = true;
    });

    load(EARTH_TEXTURES.clouds, (texture) => {
      if ("colorSpace" in texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      sceneObjects.cloudsMaterial.alphaMap = texture;
      sceneObjects.cloudsMaterial.map = texture;
      sceneObjects.cloudsMaterial.opacity = 0.14;
      sceneObjects.cloudsMaterial.needsUpdate = true;
    });

    load(EARTH_TEXTURES.lights, (texture) => {
      if ("colorSpace" in texture) {
        texture.colorSpace = THREE.SRGBColorSpace;
      }
      sceneObjects.lightsMaterial.map = texture;
      sceneObjects.lightsMaterial.opacity = 0.1;
      sceneObjects.lightsMaterial.needsUpdate = true;
    });
  }

  function addGroundGrid() {
    const gridGroup = new THREE.Group();
    const gridMaterial = new THREE.LineBasicMaterial({
      color: 0x2d8ca7,
      transparent: true,
      opacity: 0.34,
    });

    for (let lat = -75; lat <= 75; lat += 15) {
      const points = [];
      for (let lon = 0; lon <= 360; lon += 4) {
        points.push(latLonAltToVector3(lat, lon, 12));
      }
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
    }

    for (let lon = 0; lon < 360; lon += 15) {
      const points = [];
      for (let lat = -85; lat <= 85; lat += 4) {
        points.push(latLonAltToVector3(lat, lon, 12));
      }
      gridGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
    }

    sceneObjects.gridGroup = gridGroup;
    sceneObjects.earthGroup.add(gridGroup);
  }

  function addOrbitTrace() {
    const orbitPoints = [];
    for (let step = 0; step <= 360; step += 3) {
      const simulated = getScriptedIssState((ORBIT_PERIOD_SECONDS / 360) * step);
      orbitPoints.push(latLonAltToVector3(simulated.lat, simulated.lon, simulated.altMeters));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineDashedMaterial({
      color: 0x8de67a,
      dashSize: 0.16,
      gapSize: 0.08,
      transparent: true,
      opacity: 0.65,
    });

    sceneObjects.orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    sceneObjects.orbitLine.computeLineDistances();
    sceneObjects.earthGroup.add(sceneObjects.orbitLine);
  }

  function addDebrisCloud() {
    const debrisGroup = new THREE.Group();
    const phoneMode = isPhoneViewport();
    const shellConfigs = [
      { altitudeKm: 420, color: 0x89ffd0, tiltDeg: 51.6 },
      { altitudeKm: 550, color: 0x7de8ff, tiltDeg: 53.2 },
      { altitudeKm: 780, color: 0xffa06b, tiltDeg: 74 },
      { altitudeKm: 1200, color: 0x8dbdff, tiltDeg: 97.6 },
      { altitudeKm: 1550, color: 0xc9a5ff, tiltDeg: 86.4 },
    ];

    shellConfigs.forEach((config) => {
      const shell = createOrbitShell(config.altitudeKm, config.color, config.tiltDeg);
      debrisGroup.add(shell);
      sceneObjects.debrisShells.push(shell);
    });

    const shardCount = phoneMode ? 180 : 520;
    const derelictCount = phoneMode ? 42 : 120;
    const speckCount = phoneMode ? 3600 : 14000;

    for (let index = 0; index < shardCount; index += 1) {
      const shard = createDebrisShard(index);
      debrisGroup.add(shard);
      sceneObjects.debrisPieces.push(shard);
    }

    for (let index = 0; index < derelictCount; index += 1) {
      const derelict = createDerelictSatellite(index);
      debrisGroup.add(derelict);
      sceneObjects.debrisPieces.push(derelict);
    }

    const debrisSpecks = createDebrisSpeckField(speckCount);
    debrisGroup.add(debrisSpecks);
    sceneObjects.debrisSpecks = debrisSpecks;

    sceneObjects.debrisCloud = debrisGroup;
    sceneObjects.debrisCloud.rotation.z = degreesToRadians(23);
    sceneObjects.earthGroup.add(sceneObjects.debrisCloud);
  }

  function addSiteMarkers() {
    SITE_CONFIGS.forEach((site) => {
      const anchor = latLonAltToVector3(site.lat, site.lon, site.altMeters);
      const outward = anchor.clone().normalize();
      const stemTip = anchor.clone().add(outward.clone().multiplyScalar(0.44));
      const group = new THREE.Group();

      const localUp = new THREE.Vector3(0, 1, 0);
      group.position.copy(anchor);
      group.quaternion.setFromUnitVectors(localUp, outward);

      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.06, 0.055, 18),
        new THREE.MeshStandardMaterial({
          color: 0xa4b6c8,
          metalness: 0.62,
          roughness: 0.45,
        })
      );
      base.position.y = 0.02;
      group.add(base);

      const mastStem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.006, 0.009, 0.34, 14),
        new THREE.MeshBasicMaterial({
          color: site.displayColor,
          transparent: true,
          opacity: 0.82,
          depthWrite: false,
        })
      );
      mastStem.position.y = 0.18;
      group.add(mastStem);

      const tipGlow = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 18, 18),
        new THREE.MeshBasicMaterial({
          color: site.displayColor,
          transparent: true,
          opacity: 0.96,
          depthWrite: false,
        })
      );
      tipGlow.position.y = 0.35;
      group.add(tipGlow);

      const aura = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 16, 16),
        new THREE.MeshBasicMaterial({
          color: site.displayColor,
          transparent: true,
          opacity: 0.28,
          depthWrite: false,
        })
      );
      aura.position.y = 0.35;
      group.add(aura);

      let cap;
      let ring;
      let beacon;
      if (site.id === "rx") {
        const rxModel = createReceiverModel(site.displayColor);
        cap = rxModel.hit;
        ring = rxModel.ring;
        beacon = rxModel.beacon;
        group.add(rxModel.root);
        group.scale.setScalar(1.32);
      } else {
        const txModel = createTransmitterModel(site.displayColor);
        cap = txModel.hit;
        ring = txModel.ring;
        beacon = txModel.beacon;
        group.add(txModel.root);
        group.scale.setScalar(1.24);
      }

      cap.userData.entityId = site.id;

      sceneObjects.earthGroup.add(group);
      appState.markers[site.id] = { site, anchor, stemTip, group, cap, ring, beacon, aura, tipGlow };
      sceneObjects.interactiveMeshes.push(cap);
    });
  }

  function addIssMarker() {
    const group = new THREE.Group();
    const trussMaterial = new THREE.MeshStandardMaterial({
      color: 0xcbd6df,
      metalness: 0.78,
      roughness: 0.36,
    });
    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x3d68af,
      emissive: 0x2858a2,
      emissiveIntensity: 0.46,
      metalness: 0.22,
      roughness: 0.48,
    });

    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.04, 0.04), trussMaterial);
    group.add(spine);

    const moduleA = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.22, 18), trussMaterial);
    moduleA.rotation.z = Math.PI / 2;
    moduleA.position.x = -0.07;
    group.add(moduleA);

    const moduleB = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.2, 18), trussMaterial);
    moduleB.rotation.z = Math.PI / 2;
    moduleB.position.x = 0.16;
    group.add(moduleB);

    const panelLeft = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.013, 0.14), panelMaterial);
    panelLeft.position.set(-0.34, 0, 0);
    group.add(panelLeft);

    const panelRight = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.013, 0.14), panelMaterial);
    panelRight.position.set(0.34, 0, 0);
    group.add(panelRight);

    const panelLeftOuter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.013, 0.125), panelMaterial);
    panelLeftOuter.position.set(-0.66, 0, 0);
    group.add(panelLeftOuter);

    const panelRightOuter = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.013, 0.125), panelMaterial);
    panelRightOuter.position.set(0.66, 0, 0);
    group.add(panelRightOuter);

    const trussLeft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.018), trussMaterial);
    trussLeft.position.set(-0.17, 0, 0);
    group.add(trussLeft);

    const trussRight = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.018, 0.018), trussMaterial);
    trussRight.position.set(0.17, 0, 0);
    group.add(trussRight);

    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.15, 0.01), trussMaterial);
    radiator.position.set(0.03, 0.08, 0);
    group.add(radiator);

    const body = new THREE.Mesh(
      new THREE.SphereGeometry(0.2, 16, 16),
      new THREE.MeshBasicMaterial({
        color: 0x9cf276,
        transparent: true,
        opacity: 0.01,
      })
    );
    body.userData.entityId = "iss";
    group.add(body);

    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 22, 22),
      new THREE.MeshBasicMaterial({
        color: 0x9cf276,
        transparent: true,
        opacity: 0.18,
      })
    );
    group.add(halo);

    sceneObjects.earthGroup.add(group);
    appState.markers.iss = { group, body, halo, stemTip: new THREE.Vector3() };
    sceneObjects.interactiveMeshes.push(body);
    group.scale.setScalar(0.3);
  }

  function createReceiverModel(color) {
    const root = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: 0xc3d5e4,
      metalness: 0.72,
      roughness: 0.38,
    });
    const accent = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.55,
    });

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.021, 0.16, 16), metal);
    mast.position.y = 0.12;
    root.add(mast);

    const support = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.08, 0.018), metal);
    support.position.set(0, 0.2, -0.018);
    root.add(support);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(0.108, 30, 20, 0, Math.PI * 2, 0, Math.PI / 2.15),
      metal
    );
    dish.position.y = 0.22;
    dish.rotation.x = Math.PI;
    root.add(dish);

    const feedArm = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.076, 0.012), metal);
    feedArm.position.set(0, 0.235, 0.058);
    feedArm.rotation.x = degreesToRadians(-35);
    root.add(feedArm);

    const feed = new THREE.Mesh(new THREE.SphereGeometry(0.017, 12, 12), metal);
    feed.position.set(0, 0.254, 0.076);
    root.add(feed);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.2, 42),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.62,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.position.y = 0.008;
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);

    const beacon = new THREE.Mesh(
      new THREE.ConeGeometry(0.085, 0.28, 22, 1, true),
      accent
    );
    beacon.position.y = 0.28;
    root.add(beacon);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.13, 14, 14),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, depthWrite: false })
    );
    hit.position.y = 0.24;
    root.add(hit);

    return { root, ring, beacon, hit };
  }

  function createTransmitterModel(color) {
    const root = new THREE.Group();
    const metal = new THREE.MeshStandardMaterial({
      color: 0xd6dce4,
      metalness: 0.74,
      roughness: 0.34,
    });

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.3, 18), metal);
    tower.position.y = 0.14;
    root.add(tower);

    const topSpire = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.016, 0.16, 12), metal);
    topSpire.position.y = 0.36;
    root.add(topSpire);

    const ringOne = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.0035, 10, 38), metal);
    ringOne.position.y = 0.29;
    ringOne.rotation.x = Math.PI / 2;
    root.add(ringOne);

    const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.0035, 10, 38), metal);
    ringTwo.position.y = 0.37;
    ringTwo.rotation.x = Math.PI / 2;
    root.add(ringTwo);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.17, 0.21, 42),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.58,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ring.position.y = 0.008;
    ring.rotation.x = -Math.PI / 2;
    root.add(ring);

    const beacon = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.4, 24, 1, true),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.26,
        depthWrite: false,
      })
    );
    beacon.position.y = 0.3;
    root.add(beacon);

    const hit = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 14, 14),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.01, depthWrite: false })
    );
    hit.position.y = 0.25;
    root.add(hit);

    return { root, ring, beacon, hit };
  }

  function createOrbitShell(altitudeKm, color, tiltDeg) {
    const points = [];
    for (let angle = 0; angle <= 360; angle += 3) {
      const radians = degreesToRadians(angle);
      points.push(
        new THREE.Vector3(
          Math.cos(radians) * kilometersToSceneRadius(altitudeKm),
          0,
          Math.sin(radians) * kilometersToSceneRadius(altitudeKm)
        )
      );
    }

    const shell = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.24,
      })
    );
    shell.rotation.x = degreesToRadians(tiltDeg);
    shell.rotation.z = degreesToRadians(THREE.MathUtils.randFloat(-35, 35));
    return shell;
  }

  function createDebrisShard(seed) {
    const geometryChoices = [
      new THREE.BoxGeometry(0.011, 0.007, 0.006),
      new THREE.BoxGeometry(0.009, 0.009, 0.009),
      new THREE.TetrahedronGeometry(0.008, 0),
    ];
    const mesh = new THREE.Mesh(
      geometryChoices[seed % geometryChoices.length],
      new THREE.MeshStandardMaterial({
        color: seed % 3 === 0 ? 0xaeb7c4 : seed % 3 === 1 ? 0x8d9bab : 0xc7825b,
        metalness: 0.42,
        roughness: 0.55,
      })
    );
    const altitudeKm = sampleLeoAltitudeKm();
    const inclinationDeg = sampleLeoInclinationDeg();
    placeObjectInLeo(mesh, altitudeKm, inclinationDeg);
    mesh.userData.spin = new THREE.Vector3(
      THREE.MathUtils.randFloat(0.002, 0.01),
      THREE.MathUtils.randFloat(0.002, 0.01),
      THREE.MathUtils.randFloat(0.002, 0.01)
    );
    return mesh;
  }

  function createDerelictSatellite(seed) {
    const group = new THREE.Group();
    const bus = new THREE.Mesh(
      new THREE.BoxGeometry(0.028, 0.016, 0.016),
      new THREE.MeshStandardMaterial({
        color: 0xc0c8d2,
        metalness: 0.65,
        roughness: 0.4,
      })
    );
    group.add(bus);

    const panelMaterial = new THREE.MeshStandardMaterial({
      color: 0x476fb0,
      emissive: 0x274a84,
      emissiveIntensity: 0.22,
      metalness: 0.22,
      roughness: 0.55,
    });
    const leftPanel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0024, 0.03), panelMaterial);
    leftPanel.position.x = -0.027;
    group.add(leftPanel);

    const rightPanel = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.0024, 0.03), panelMaterial);
    rightPanel.position.x = 0.027;
    group.add(rightPanel);

    const altitudeKm = sampleLeoAltitudeKm();
    const inclinationDeg = sampleLeoInclinationDeg();
    placeObjectInLeo(group, altitudeKm, inclinationDeg);
    group.rotation.set(
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI)
    );
    group.userData.spin = new THREE.Vector3(
      THREE.MathUtils.randFloat(0.001, 0.004),
      THREE.MathUtils.randFloat(0.001, 0.004),
      THREE.MathUtils.randFloat(0.001, 0.004)
    );
    group.userData.orbitDrift = 0.0006 + seed * 0.00003;
    return group;
  }

  function createDebrisSpeckField(count) {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let index = 0; index < count; index += 1) {
      const altitudeKm = sampleLeoAltitudeKm();
      const inclinationDeg = sampleLeoInclinationDeg();
      const anomaly = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const raan = THREE.MathUtils.randFloat(0, Math.PI * 2);
      const point = getLeoOrbitPosition(altitudeKm, inclinationDeg, anomaly, raan);
      positions[index * 3] = point.x;
      positions[index * 3 + 1] = point.y;
      positions[index * 3 + 2] = point.z;

      const tint = getLeoBandColor(altitudeKm);
      colors[index * 3] = tint.r;
      colors[index * 3 + 1] = tint.g;
      colors[index * 3 + 2] = tint.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.011,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
        vertexColors: true,
      })
    );
  }

  function placeObjectInLeo(object, altitudeKm, inclinationDeg) {
    const anomaly = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const raan = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const position = getLeoOrbitPosition(altitudeKm, inclinationDeg, anomaly, raan);
    object.position.copy(position);
    object.userData.altitudeKm = altitudeKm;
    object.userData.orbitRaan = raan;
    object.userData.orbitInclination = inclinationDeg;
  }

  function getLeoOrbitPosition(altitudeKm, inclinationDeg, anomaly, raan) {
    const baseRadius = kilometersToSceneRadius(altitudeKm);
    const eccentricity = THREE.MathUtils.randFloat(0, 0.012);
    const radius = baseRadius * (1 + Math.cos(anomaly) * eccentricity);
    const position = new THREE.Vector3(
      radius * Math.cos(anomaly),
      0,
      radius * Math.sin(anomaly)
    );
    position.applyAxisAngle(new THREE.Vector3(1, 0, 0), degreesToRadians(inclinationDeg));
    position.applyAxisAngle(new THREE.Vector3(0, 1, 0), raan);
    return position;
  }

  function sampleLeoAltitudeKm() {
    const band = pickWeighted(LEO_ALTITUDE_BANDS);
    return THREE.MathUtils.randFloat(band.minKm, band.maxKm);
  }

  function sampleLeoInclinationDeg() {
    return pickWeighted(LEO_INCLINATIONS).degrees;
  }

  function pickWeighted(weightedItems) {
    const total = weightedItems.reduce((sum, item) => sum + item.weight, 0);
    let threshold = Math.random() * total;
    for (let index = 0; index < weightedItems.length; index += 1) {
      threshold -= weightedItems[index].weight;
      if (threshold <= 0) {
        return weightedItems[index];
      }
    }
    return weightedItems[weightedItems.length - 1];
  }

  function getLeoBandColor(altitudeKm) {
    if (altitudeKm < 500) {
      return { r: 0.68, g: 0.95, b: 0.96 };
    }
    if (altitudeKm < 700) {
      return { r: 0.57, g: 0.87, b: 1 };
    }
    if (altitudeKm < 1000) {
      return { r: 0.99, g: 0.76, b: 0.56 };
    }
    if (altitudeKm < 1400) {
      return { r: 0.67, g: 0.74, b: 1 };
    }
    return { r: 0.83, g: 0.67, b: 1 };
  }

  function addPathLines() {
    sceneObjects.directLine = createPathLine(0xffb95d);
    sceneObjects.txIssLine = createPathLine(0xff7c5c);
    sceneObjects.issRxLine = createPathLine(0x67edff);

    [sceneObjects.directLine, sceneObjects.txIssLine, sceneObjects.issRxLine].forEach((path) => {
      sceneObjects.earthGroup.add(path.glow, path.line, path.pulse);
    });
  }

  function createPathLine(color) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));

    const glowMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.24,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
    });
    const coreMaterial = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      depthTest: false,
    });

    return {
      glow: new THREE.Line(geometry, glowMaterial),
      line: new THREE.Line(geometry, coreMaterial),
      pulse: new THREE.Mesh(
        new THREE.SphereGeometry(0.048, 16, 16),
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.94,
          depthWrite: false,
          depthTest: false,
        })
      ),
    };
  }

  function attachPointerControls() {
    const canvas = sceneObjects.renderer.domElement;

    canvas.addEventListener("pointerdown", (event) => {
      appState.drag.active = true;
      appState.drag.pointerId = event.pointerId;
      appState.drag.lastX = event.clientX;
      appState.drag.lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!appState.drag.active) {
        return;
      }

      const deltaX = event.clientX - appState.drag.lastX;
      const deltaY = event.clientY - appState.drag.lastY;
      appState.drag.lastX = event.clientX;
      appState.drag.lastY = event.clientY;

      appState.cameraTarget.azimuth -= deltaX * 0.0055;
      appState.cameraTarget.polar = THREE.MathUtils.clamp(
        appState.cameraTarget.polar + deltaY * 0.0048,
        0.42,
        Math.PI - 0.42
      );
    });

    canvas.addEventListener("pointerup", (event) => {
      if (appState.drag.pointerId === event.pointerId) {
        canvas.releasePointerCapture(event.pointerId);
        appState.drag.active = false;
      }
    });

    canvas.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault();
        appState.cameraTarget.distance = THREE.MathUtils.clamp(
          appState.cameraTarget.distance + event.deltaY * 0.0025,
          4.8,
          11.5
        );
      },
      { passive: false }
    );

    canvas.addEventListener("click", (event) => {
      const bounds = canvas.getBoundingClientRect();
      appState.raycastPointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      appState.raycastPointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
      sceneObjects.raycaster.setFromCamera(appState.raycastPointer, sceneObjects.camera);
      const hits = sceneObjects.raycaster.intersectObjects(sceneObjects.interactiveMeshes, false);

      if (hits.length > 0 && hits[0].object.userData.entityId) {
        const entityId = hits[0].object.userData.entityId;
        setSelection(entityId);
        focusOnEntity(entityId);
      }
    });
  }

  function animate(now) {
    const deltaSeconds = Math.min((now - appState.lastFrameTime) / 1000, 0.05);
    appState.lastFrameTime = now;

    if (!appState.simulationPaused) {
      appState.simSeconds += deltaSeconds;
    }

    if (now >= appState.nextLivePollAt) {
      requestLiveIssData(false);
    }
    if (PAGE_MODE === "dashboard" && now >= appState.nextN2yoPollAt) {
      requestN2yoPassData(false);
    }
    if (now >= appState.nextOrbitsmithPollAt) {
      requestOrbitsmithData(false);
    }
    if (now >= appState.nextLeolabsPollAt) {
      requestLeoLabsData(false);
    }

    updateCamera();
    updateLiveOrScriptedIss(deltaSeconds);
    updateDynamicScene(now);
    syncModeIndicators();
    sceneObjects.renderer.render(sceneObjects.scene, sceneObjects.camera);
    requestAnimationFrame(animate);
  }

  function updateCamera() {
    appState.cameraCurrent.azimuth = THREE.MathUtils.lerp(
      appState.cameraCurrent.azimuth,
      appState.cameraTarget.azimuth,
      0.08
    );
    appState.cameraCurrent.polar = THREE.MathUtils.lerp(
      appState.cameraCurrent.polar,
      appState.cameraTarget.polar,
      0.08
    );
    appState.cameraCurrent.distance = THREE.MathUtils.lerp(
      appState.cameraCurrent.distance,
      appState.cameraTarget.distance,
      0.08
    );

    const radius = appState.cameraCurrent.distance;
    const polar = appState.cameraCurrent.polar;
    const azimuth = appState.cameraCurrent.azimuth;
    sceneObjects.camera.position.set(
      radius * Math.sin(polar) * Math.sin(azimuth),
      radius * Math.cos(polar),
      radius * Math.sin(polar) * Math.cos(azimuth)
    );
    sceneObjects.camera.lookAt(0, 0, 0);

    if (sceneObjects.atmosphereMesh) {
      sceneObjects.atmosphereMesh.material.uniforms.cameraVector.value.copy(sceneObjects.camera.position);
    }
  }

  function updateLiveOrScriptedIss(deltaSeconds) {
    const scriptedState = getScriptedIssState(appState.simSeconds);
    let currentState = scriptedState;

    if (appState.liveMode === "live" && appState.liveTargetState) {
      if (!appState.displayedIssState) {
        appState.displayedIssState = { ...appState.liveTargetState };
      } else {
        appState.displayedIssState = {
          timestamp: appState.displayedIssState.timestamp + deltaSeconds * 1000,
          lat: THREE.MathUtils.lerp(appState.displayedIssState.lat, appState.liveTargetState.lat, 0.03),
          lon: shortestLongitudeLerp(appState.displayedIssState.lon, appState.liveTargetState.lon, 0.03),
          altMeters: THREE.MathUtils.lerp(
            appState.displayedIssState.altMeters,
            appState.liveTargetState.altMeters,
            0.03
          ),
          velocityKmS: appState.liveTargetState.velocityKmS,
        };
      }
      currentState = appState.displayedIssState;
    } else {
      appState.displayedIssState = scriptedState;
    }

    const issVector = latLonAltToVector3(
      currentState.lat,
      currentState.lon,
      currentState.altMeters
    );
    appState.markers.iss.group.position.copy(issVector);
    appState.markers.iss.stemTip.copy(issVector);
    appState.markers.iss.group.lookAt(0, 0, 0);
    appState.markers.iss.group.rotateY(Math.PI / 2);
    appState.markers.iss.group.rotateZ(appState.simSeconds * 0.08);
  }

  function updateDynamicScene(now) {
    const rxMarker = appState.markers.rx;
    const txMarker = appState.markers.tx;
    const issMarker = appState.markers.iss;
    if (!rxMarker || !txMarker || !issMarker) {
      return;
    }

    const metrics = computeMetrics(txMarker.stemTip, rxMarker.stemTip, issMarker.stemTip);
    appState.currentMetrics = metrics;

    updatePathLine(sceneObjects.directLine, txMarker.stemTip, rxMarker.stemTip, now * 0.00018);
    updatePathLine(sceneObjects.txIssLine, txMarker.stemTip, issMarker.stemTip, now * 0.00032);
    updatePathLine(sceneObjects.issRxLine, issMarker.stemTip, rxMarker.stemTip, now * 0.00028);

    rxMarker.ring.rotation.z += 0.008;
    txMarker.ring.rotation.z -= 0.01;
    rxMarker.beacon.scale.setScalar(1 + Math.sin(now * 0.0042) * 0.06);
    txMarker.beacon.scale.setScalar(1 + Math.sin(now * 0.0033) * 0.08);
    if (rxMarker.aura) {
      rxMarker.aura.scale.setScalar(1 + Math.sin(now * 0.0042) * 0.1);
      rxMarker.aura.material.opacity = 0.2 + (Math.sin(now * 0.0048) + 1) * 0.06;
    }
    if (txMarker.aura) {
      txMarker.aura.scale.setScalar(1 + Math.sin(now * 0.0038) * 0.12);
      txMarker.aura.material.opacity = 0.18 + (Math.sin(now * 0.0042) + 1) * 0.07;
    }
    txMarker.beacon.material.opacity = 0.16 + (Math.sin(now * 0.0035) + 1) * 0.05;
    rxMarker.beacon.material.opacity = 0.34 + (Math.sin(now * 0.0048) + 1) * 0.06;
    issMarker.halo.scale.setScalar(1 + Math.sin(now * 0.004) * 0.08);
    sceneObjects.debrisCloud.rotation.y += 0.0006;
    if (sceneObjects.debrisSpecks) {
      sceneObjects.debrisSpecks.rotation.y += 0.0004;
      sceneObjects.debrisSpecks.rotation.x += 0.00005;
    }
    sceneObjects.debrisPieces.forEach((piece, index) => {
      if (piece.userData.spin) {
        piece.rotation.x += piece.userData.spin.x;
        piece.rotation.y += piece.userData.spin.y;
        piece.rotation.z += piece.userData.spin.z;
      }
      if (piece.userData.orbitDrift) {
        const orbitalNormal = new THREE.Vector3(0, 1, 0);
        if (typeof piece.userData.orbitInclination === "number") {
          orbitalNormal.applyAxisAngle(
            new THREE.Vector3(1, 0, 0),
            degreesToRadians(piece.userData.orbitInclination)
          );
        }
        if (typeof piece.userData.orbitRaan === "number") {
          orbitalNormal.applyAxisAngle(new THREE.Vector3(0, 1, 0), piece.userData.orbitRaan);
        }
        piece.position.applyAxisAngle(orbitalNormal.normalize(), piece.userData.orbitDrift * 0.12);
      } else if (index % 4 === 0) {
        piece.position.applyAxisAngle(new THREE.Vector3(0, 1, 0), 0.0002);
      }
    });
    if (sceneObjects.cloudsMesh) {
      sceneObjects.cloudsMesh.rotation.y += 0.00055;
    }
    if (sceneObjects.lightsMesh) {
      sceneObjects.lightsMesh.rotation.y += 0.00008;
    }
    if (sceneObjects.saudiRing) {
      sceneObjects.saudiRing.rotation.z += 0.0032;
      sceneObjects.saudiPulse.scale.setScalar(1 + Math.sin(now * 0.0038) * 0.12);
      sceneObjects.saudiPulse.material.opacity = 0.18 + (Math.sin(now * 0.004) + 1) * 0.08;
      if (sceneObjects.saudiRegionFill) {
        sceneObjects.saudiRegionFill.material.opacity = 0.12 + (Math.sin(now * 0.0024) + 1) * 0.04;
      }
    }
    sceneObjects.stars.rotation.y += 0.00008;

    updateMetrics(metrics);
    updateDashboardAnalytics(metrics);
    updateFocusPanel();
    updateOverlayLabels(metrics);

    if (appState.storyMode && appState.storyIndex === 2) {
      setCameraTarget(getCameraFromTargetVector(issMarker.stemTip, 7.35, 1.08));
    }
  }

  function updatePathLine(path, start, end, phase) {
    const positions = path.line.geometry.attributes.position.array;
    positions[0] = start.x;
    positions[1] = start.y;
    positions[2] = start.z;
    positions[3] = end.x;
    positions[4] = end.y;
    positions[5] = end.z;
    path.line.geometry.attributes.position.needsUpdate = true;

    const pulseT = ((phase % 1) + 1) % 1;
    path.pulse.position.copy(start).lerp(end, pulseT);
  }

  function updateMetrics(metrics) {
    const cards = [
      {
        key: "baseline",
        label: "TX-RX Baseline",
        value: metrics.labels.baseline,
        note: "Direct geometric baseline between the transmitter and receiver.",
      },
      {
        key: "txToIss",
        label: "TX to ISS",
        value: metrics.labels.txToIss,
        note: "Outbound leg from illuminator to the tracked object.",
      },
      {
        key: "issToRx",
        label: "ISS to RX",
        value: metrics.labels.issToRx,
        note: "Reflected leg from the tracked object to the receiving node.",
      },
      {
        key: "total",
        label: "Bistatic Path",
        value: metrics.labels.totalPath,
        note: "Combined reflected travel path used in passive radar geometry.",
      },
      {
        key: "excess",
        label: "Excess Path",
        value: metrics.labels.excessPath,
        note: "Additional travel distance relative to the direct baseline.",
      },
      {
        key: "delay",
        label: "Propagation Delay",
        value: metrics.labels.delay,
        note: "Time-of-arrival offset from the excess path length.",
      },
    ];

    refs.metricsGrid.innerHTML = cards
      .map((card) => {
        const highlight =
          (appState.selectedEntity === "tx" && (card.key === "baseline" || card.key === "txToIss")) ||
          (appState.selectedEntity === "rx" && (card.key === "baseline" || card.key === "issToRx")) ||
          (appState.selectedEntity === "iss" &&
            (card.key === "txToIss" || card.key === "issToRx" || card.key === "total"));

        return `
          <article class="metric-card ${highlight ? "metric-card--highlight" : ""}">
            <span>${card.label}</span>
            <strong>${card.value}</strong>
            <p>${card.note}</p>
          </article>
        `;
      })
      .join("");

    refs.metricsModeTag.textContent =
      appState.liveMode === "live" ? "Live Geometry" : appState.liveMode === "connecting" ? "Syncing" : "Scripted Geometry";

    updateHeroMetrics(metrics);
    updateTelemetryRibbon(metrics);
  }

  function updateHeroMetrics(metrics) {
    setNodeText(refs.heroBaselineValue, metrics ? metrics.labels.baseline : "--");
    setNodeText(refs.heroPathValue, metrics ? metrics.labels.totalPath : "--");
    setNodeText(refs.heroDelayValue, metrics ? metrics.labels.delay : "--");
    setNodeText(
      refs.heroModeValue,
      appState.liveMode === "live" ? "Live ISS" : appState.liveMode === "connecting" ? "Syncing" : "Scripted"
    );
  }

  function updateTelemetryRibbon(metrics = appState.currentMetrics) {
    const timestampLabel =
      appState.displayedIssState && appState.displayedIssState.timestamp
        ? formatTelemetryTime(appState.displayedIssState.timestamp)
        : "Waiting for orbit state";
    const isVisualizerPage = PAGE_MODE === "visualizer";
    const leoSnapshot = appState.orbitsmithSnapshot || ORBITSMITH_FALLBACK_SNAPSHOT;
    const leolabsStatus = appState.leolabsMode === "live" ? "online" : appState.leolabsMode === "syncing" ? "syncing" : "fallback";
    const n2yoStatus =
      appState.n2yoMode === "live"
        ? "online"
        : appState.n2yoMode === "cached"
          ? "cached"
        : appState.n2yoMode === "syncing"
          ? "syncing"
          : appState.n2yoMode === "missing-key"
            ? "key needed"
            : "fallback";

    if (isVisualizerPage) {
      refs.tickerStatus.textContent =
        appState.liveMode === "live"
          ? `Live geometry updated ${timestampLabel}`
          : appState.liveMode === "connecting"
            ? "Attempting live ISS sync"
            : "Scripted orbit active";
    } else {
      refs.tickerStatus.textContent =
        appState.liveMode === "live"
          ? `Live geometry ${timestampLabel} | N2YO ${n2yoStatus} | LEO ${appState.orbitsmithMode === "live" ? "online" : "fallback"} | LeoLabs ${leolabsStatus}`
          : appState.liveMode === "connecting"
            ? "Attempting live ISS sync"
            : `Scripted orbit active | N2YO ${n2yoStatus} | LEO ${appState.orbitsmithMode === "live" ? "online" : "fallback"} | LeoLabs ${leolabsStatus}`;
    }

    const baseItems = [
      `Feed ${appState.liveMode === "live" ? "live ISS" : appState.liveMode === "connecting" ? "syncing" : "scripted orbit"}`,
      `Focus ${appState.selectedEntity.toUpperCase()}`,
      metrics ? `Baseline ${metrics.labels.baseline}` : "Baseline pending",
      metrics ? `TX to target ${metrics.labels.txToIss}` : "TX leg pending",
      metrics ? `Target to RX ${metrics.labels.issToRx}` : "RX leg pending",
      metrics ? `Delay ${metrics.labels.delay}` : "Delay pending",
      appState.layers.rx ? "RX PNU telescope on" : "RX node hidden",
      appState.layers.tx ? "TX Riyadh TV tower on" : "TX node hidden",
      appState.layers.links ? "Radar links on" : "Radar links off",
      appState.layers.debris ? "Debris layer on" : "Debris layer off",
    ];

    const storylineIntelItems = [
      `N2YO ${n2yoStatus}`,
      `LEO ${appState.orbitsmithMode === "live" ? "live TLE snapshot" : "cached snapshot"}`,
      `LeoLabs ${leolabsStatus}`,
      `Tracked ${formatInteger(leoSnapshot.trackedObjects)} objects`,
      `Debris ${formatInteger(leoSnapshot.debris)} objects`,
      `24h conjunctions ${formatInteger(leoSnapshot.activeConjunctions24h)}`,
      `Critical CDMs ${formatInteger(leoSnapshot.riskCritical)}`,
    ];
    const items = isVisualizerPage ? baseItems : baseItems.concat(storylineIntelItems);

    refs.tickerTrack.innerHTML = items
      .map((item) => `<span class="ticker-pill">${item}</span>`)
      .join("");
  }

  function updateDashboardAnalytics(metrics) {
    if (!metrics || PAGE_MODE !== "dashboard") {
      return;
    }

    const txMarker = appState.markers.tx;
    const rxMarker = appState.markers.rx;
    const issMarker = appState.markers.iss;
    const issState = appState.displayedIssState;
    if (!txMarker || !rxMarker || !issMarker || !issState) {
      return;
    }

    const nowMs = performance.now();
    if (!appState.dashboardPassEstimate || nowMs - appState.dashboardPassEstimate.updatedAt > 1000) {
      appState.dashboardPassEstimate = estimateClosestPass(nowMs);
    }

    const passEstimate = getDashboardPassInfo(appState.dashboardPassEstimate);
    const altitudeKm = finiteOrFallback(issState.altMeters, 418000) / 1000;
    const speedKmS = finiteOrFallback(issState.velocityKmS, 7.66);
    const bistaticAngleDeg = computeBistaticAngle(txMarker.stemTip, rxMarker.stemTip, issMarker.stemTip);
    const opportunityScore = computeGeometryOpportunity(metrics, bistaticAngleDeg);
    const lambdaMeters = SPEED_OF_LIGHT_M_PER_S / 546000000;
    const maxDopplerKhz = ((2 * speedKmS * 1000) / lambdaMeters) / 1000;
    const rangeResolutionMeters = SPEED_OF_LIGHT_M_PER_S / (2 * 50000000);

    setNodeText(refs.passStatusValue, passEstimate.status);
    setNodeText(refs.timeToClosestPassValue, formatDuration(passEstimate.secondsToMax));
    setNodeText(refs.issAltitudeValue, `${altitudeKm.toFixed(0)} km`);
    setNodeText(refs.issSpeedValue, `${speedKmS.toFixed(2)} km/s`);
    setNodeText(refs.passWindowValue, passEstimate.windowLabel);
    setNodeText(refs.n2yoMaxElevationValue, passEstimate.maxElevationLabel);
    setNodeText(refs.n2yoPassAzimuthValue, passEstimate.azimuthLabel);
    setNodeText(refs.n2yoPassSourceValue, passEstimate.sourceLabel);
    if (refs.passProgressFill) {
      refs.passProgressFill.style.width = `${passEstimate.progressPct.toFixed(0)}%`;
    }

    setNodeText(refs.dashboardBaselineValue, metrics.labels.baseline);
    setNodeText(refs.dashboardTxTargetValue, metrics.labels.txToIss);
    setNodeText(refs.dashboardTargetRxValue, metrics.labels.issToRx);
    setNodeText(refs.dashboardBistaticValue, metrics.labels.totalPath);
    setNodeText(refs.dashboardDelayValue, metrics.labels.delay);
    setNodeText(refs.dashboardBistaticAngleValue, `${bistaticAngleDeg.toFixed(1)} deg`);

    setNodeText(refs.opportunityGaugeValue, `${opportunityScore}%`);
    if (refs.opportunityGaugeFill) {
      refs.opportunityGaugeFill.style.background = `conic-gradient(#3ff2d2 ${opportunityScore * 3.6}deg, rgba(255,255,255,0.09) 0deg)`;
    }
    setNodeText(refs.dopplerEstimateValue, `up to +/-${maxDopplerKhz.toFixed(1)} kHz`);
    setNodeText(refs.geometryQualityValue, geometryQualityLabel(opportunityScore));
    setNodeText(refs.rangeResolutionValue, `${rangeResolutionMeters.toFixed(1)} m at 50 MHz`);
    setNodeText(refs.coherentProcessingValue, "DVB-T CAF + clutter suppression");

    updateGroundNodeCards();
  }

  function estimateClosestPass(updatedAt) {
    const txMarker = appState.markers.tx;
    const rxMarker = appState.markers.rx;
    const referencePoint = txMarker && rxMarker ? midpoint(txMarker.stemTip, rxMarker.stemTip) : new THREE.Vector3();
    let bestOffset = 0;
    let bestDistance = Infinity;

    for (let offsetSeconds = 0; offsetSeconds <= ORBIT_PERIOD_SECONDS; offsetSeconds += 20) {
      const sample = getScriptedIssState(appState.simSeconds + offsetSeconds);
      const sampleVector = latLonAltToVector3(sample.lat, sample.lon, sample.altMeters);
      const distanceKm = sceneDistanceToKilometers(sampleVector.distanceTo(referencePoint));
      if (distanceKm < bestDistance) {
        bestDistance = distanceKm;
        bestOffset = offsetSeconds;
      }
    }

    return {
      updatedAt,
      secondsToClosest: bestOffset,
      closestDistanceKm: bestDistance,
    };
  }

  function getDashboardPassInfo(fallbackEstimate) {
    const nowSeconds = Date.now() / 1000;
    const n2yoPass = getNextN2yoPass(nowSeconds);
    if (n2yoPass) {
      const startUTC = finiteOrFallback(n2yoPass.startUTC, nowSeconds);
      const endUTC = Math.max(finiteOrFallback(n2yoPass.endUTC, startUTC + 1), startUTC + 1);
      const maxUTC = THREE.MathUtils.clamp(
        finiteOrFallback(n2yoPass.maxUTC, (startUTC + endUTC) / 2),
        startUTC,
        endUTC
      );
      const secondsToMax = Math.max(0, maxUTC - nowSeconds);
      const progressPct =
        nowSeconds < startUTC
          ? THREE.MathUtils.clamp(100 - (secondsToMax / 1800) * 100, 0, 100)
          : THREE.MathUtils.clamp(((nowSeconds - startUTC) / (endUTC - startUTC)) * 100, 0, 100);
      const status =
        nowSeconds < startUTC
          ? "N2YO upcoming"
          : nowSeconds <= endUTC
            ? nowSeconds >= maxUTC - 45 && nowSeconds <= maxUTC + 45
              ? "N2YO max elevation"
              : "N2YO in pass"
            : "N2YO complete";

      return {
        secondsToMax,
        progressPct,
        status,
        windowLabel: formatTimeRange(startUTC * 1000, endUTC * 1000),
        maxElevationLabel: `${finiteOrFallback(n2yoPass.maxEl, 0).toFixed(0)} deg`,
        azimuthLabel: formatPassAzimuth(n2yoPass),
        sourceLabel: appState.n2yoMode === "cached" ? "N2YO cached pass" : "N2YO radio pass",
      };
    }

    const secondsToClosest = finiteOrFallback(fallbackEstimate && fallbackEstimate.secondsToClosest, 0);
    const status =
      secondsToClosest <= 90
        ? "Demo max pass"
        : secondsToClosest <= 900
          ? "Approaching"
          : "Tracking";
    const sourceLabel =
      appState.n2yoMode === "missing-key"
        ? "Demo estimate (add N2YO key)"
        : appState.n2yoMode === "syncing"
          ? "N2YO syncing"
          : appState.n2yoMode === "stale"
            ? "Demo estimate (stale N2YO snapshot)"
          : appState.n2yoMode === "empty"
            ? "Demo estimate (no N2YO pass)"
            : appState.n2yoMode === "error"
              ? "Demo estimate (N2YO error)"
              : "Demo estimate";

    return {
      secondsToMax: secondsToClosest,
      progressPct: THREE.MathUtils.clamp(100 - (secondsToClosest / 1800) * 100, 0, 100),
      status,
      windowLabel: formatPassWindow(secondsToClosest),
      maxElevationLabel: "-- deg",
      azimuthLabel: "--",
      sourceLabel,
    };
  }

  function getNextN2yoPass(nowSeconds) {
    if (!appState.n2yoPassSnapshot || !Array.isArray(appState.n2yoPassSnapshot.passes)) {
      return null;
    }
    return appState.n2yoPassSnapshot.passes
      .filter((pass) => finiteOrFallback(pass.endUTC, 0) > nowSeconds - 60)
      .sort((left, right) => finiteOrFallback(left.startUTC, 0) - finiteOrFallback(right.startUTC, 0))[0] || null;
  }

  function formatPassAzimuth(pass) {
    const start = formatAzimuth(pass.startAz, pass.startAzCompass);
    const end = formatAzimuth(pass.endAz, pass.endAzCompass);
    return `${start} to ${end}`;
  }

  function computeBistaticAngle(txPosition, rxPosition, targetPosition) {
    const targetToTx = txPosition.clone().sub(targetPosition).normalize();
    const targetToRx = rxPosition.clone().sub(targetPosition).normalize();
    return radiansToDegrees(targetToTx.angleTo(targetToRx));
  }

  function computeGeometryOpportunity(metrics, bistaticAngleDeg) {
    const legBalance = 1 - THREE.MathUtils.clamp(
      Math.abs(metrics.txToIssKm - metrics.issToRxKm) / Math.max(metrics.txToIssKm, metrics.issToRxKm, 1),
      0,
      1
    );
    const rangeScore = THREE.MathUtils.clamp(1 - metrics.totalPathKm / 26000, 0.18, 1);
    const angleScore = THREE.MathUtils.clamp(1 - Math.abs(bistaticAngleDeg - 165) / 165, 0.25, 1);
    const delayScore = THREE.MathUtils.clamp(metrics.delayMicroseconds / 85000, 0.2, 1);
    const score = (0.38 * legBalance + 0.3 * rangeScore + 0.22 * angleScore + 0.1 * delayScore) * 100;
    return Math.round(THREE.MathUtils.clamp(score, 18, 98));
  }

  function geometryQualityLabel(score) {
    if (score >= 78) {
      return "Strong for demo";
    }
    if (score >= 60) {
      return "Good geometry";
    }
    if (score >= 42) {
      return "Usable geometry";
    }
    return "Low opportunity";
  }

  function updateGroundNodeCards() {
    const txSite = SITE_CONFIGS.find((site) => site.id === "tx");
    const rxSite = SITE_CONFIGS.find((site) => site.id === "rx");
    if (txSite) {
      setNodeText(refs.txNodeCoords, formatCoordinatePair(txSite));
      setNodeText(refs.txNodeBand, "470-694 MHz UHF broadcast band");
      setNodeText(refs.txNodeSignal, "DVB-T / DVB-T2 illuminator");
      setNodeText(refs.txNodeRole, "Non-cooperative broadcast transmitter used as the passive radar illuminator of opportunity.");
    }
    if (rxSite) {
      setNodeText(refs.rxNodeCoords, formatCoordinatePair(rxSite));
      setNodeText(refs.rxNodeAperture, "5 m parabolic telescope aperture");
      setNodeText(refs.rxNodeBandwidth, "50 MHz receiver bandwidth model");
      setNodeText(refs.rxNodeRole, "PNU receiving node for direct-path reference capture and reflected surveillance-channel processing.");
    }
  }

  function updateFocusPanel() {
    const focus = FOCUS_CONTENT[appState.selectedEntity];
    setNodeText(refs.focusRoleTag, focus.role);

    let contextNote = "";
    if (appState.currentMetrics) {
      if (appState.selectedEntity === "tx") {
        contextNote = `Current outbound slant range to ISS: ${appState.currentMetrics.labels.txToIss}.`;
      } else if (appState.selectedEntity === "rx") {
        contextNote = `Current reflected slant range to RX: ${appState.currentMetrics.labels.issToRx}.`;
      } else {
        contextNote = `Current bistatic path: ${appState.currentMetrics.labels.totalPath} with ${appState.currentMetrics.labels.delay} excess delay.`;
      }
    }

    const focusTitle =
      appState.selectedEntity === "iss"
        ? "ISS Focus"
        : `${appState.selectedEntity.toUpperCase()} Focus`;

    const snapshotSelection =
      appState.selectedEntity === "iss"
        ? "ISS geometry focus"
        : appState.selectedEntity === "tx"
          ? "TV tower illuminator focus"
          : "PNU receiver focus";
    const snapshotNarrative =
      appState.selectedEntity === "iss"
        ? "The current view emphasizes the moving LEO target and the reflected bistatic path."
        : appState.selectedEntity === "tx"
          ? "The Riyadh TV Tower provides the outbound broadcast waveform that illuminates the target."
          : "The PNU receiver represents the receive-side chain where direct-path and reflected signals are compared.";

    if (refs.focusDetails) {
      setNodeText(refs.snapshotSelection, snapshotSelection);
      setNodeText(refs.snapshotNarrative, snapshotNarrative);
      setNodeHtml(
        refs.focusDetails,
        `
          <p>${focus.description}</p>
          <p>${contextNote}</p>
          <ul>
            ${focus.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
          </ul>
        `
      );
      return;
    }

    refs.focusCard.innerHTML = `
      <h4>${focusTitle}</h4>
      <p>${focus.description}</p>
      <p>${contextNote}</p>
      <ul>
        ${focus.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
      </ul>
    `;

    refs.snapshotSelection.textContent =
      snapshotSelection;

    refs.snapshotNarrative.textContent =
      snapshotNarrative;
  }

  function updateOverlayLabels(metrics) {
    const rxEnabled = appState.layers.rx;
    const txEnabled = appState.layers.tx;
    const nodeOffsets = computeNodeLabelOffsets(rxEnabled, txEnabled);

    updateMarkerLabel("rx", appState.markers.rx.stemTip, "PNU Telescope", "RX receiver", rxEnabled, nodeOffsets.rx);
    updateMarkerLabel("tx", appState.markers.tx.stemTip, "Riyadh TV Tower", "TX illuminator", txEnabled, nodeOffsets.tx);
    updateMarkerLabel(
      "iss",
      appState.markers.iss.stemTip,
      "ISS",
      appState.liveMode === "live" ? "Live target" : "Scripted target",
      true
    );

    updateLineLabel(
      "baseline",
      midpoint(appState.markers.tx.stemTip, appState.markers.rx.stemTip),
      "TX -> RX baseline",
      metrics.labels.baseline,
      appState.layers.links && rxEnabled && txEnabled
    );
    updateLineLabel(
      "txIss",
      midpoint(appState.markers.tx.stemTip, appState.markers.iss.stemTip),
      "TX -> ISS slant range",
      metrics.labels.txToIss,
      appState.layers.links && txEnabled
    );
    updateLineLabel(
      "issRx",
      midpoint(appState.markers.iss.stemTip, appState.markers.rx.stemTip),
      "ISS -> RX slant range",
      metrics.labels.issToRx,
      appState.layers.links && rxEnabled
    );
  }

  function computeNodeLabelOffsets(rxEnabled, txEnabled) {
    const offsets = {
      rx: { ...(LABEL_OFFSETS.rx || { x: 0, y: 0 }) },
      tx: { ...(LABEL_OFFSETS.tx || { x: 0, y: 0 }) },
    };
    if (!rxEnabled || !txEnabled || !appState.markers.rx || !appState.markers.tx) {
      return offsets;
    }

    const rxProjected = projectWorldPosition(appState.markers.rx.stemTip);
    const txProjected = projectWorldPosition(appState.markers.tx.stemTip);
    if (!rxProjected.visible || !txProjected.visible) {
      return offsets;
    }

    const deltaX = txProjected.x - rxProjected.x;
    const deltaY = txProjected.y - rxProjected.y;
    const distance = Math.hypot(deltaX, deltaY);
    const minSpacingPx = 172;
    if (distance >= minSpacingPx) {
      return offsets;
    }

    const separation = (minSpacingPx - distance) / 2;
    const unitX = distance > 0.001 ? deltaX / distance : 1;
    const unitY = distance > 0.001 ? deltaY / distance : 0;
    offsets.rx.x -= unitX * separation;
    offsets.rx.y -= unitY * separation + 10;
    offsets.tx.x += unitX * separation;
    offsets.tx.y += unitY * separation - 8;
    return offsets;
  }

  function updateMarkerLabel(id, worldPosition, title, subtitle, enabled = true, customOffset) {
    const label = appState.overlayLabels[id];
    if (!enabled) {
      label.hidden = true;
      return;
    }

    const projected = projectWorldPosition(worldPosition);
    const offset = customOffset || LABEL_OFFSETS[id] || { x: 0, y: 0 };
    if (!projected.visible) {
      label.hidden = true;
      return;
    }

    label.hidden = false;
    positionOverlayLabel(label, projected, offset);
    label.innerHTML = `<span>${subtitle}</span><strong>${title}</strong>`;
  }

  function updateLineLabel(id, worldPosition, caption, distanceText, enabled) {
    const label = appState.overlayLabels[id];
    const offset = LABEL_OFFSETS[id] || { x: 0, y: 0 };
    if (!enabled) {
      label.hidden = true;
      return;
    }

    const projected = projectWorldPosition(worldPosition);
    if (!projected.visible) {
      label.hidden = true;
      return;
    }

    label.hidden = false;
    positionOverlayLabel(label, projected, offset);
    label.innerHTML = `<span>${caption}</span><strong>${distanceText}</strong>`;
  }

  function positionOverlayLabel(label, projected, offset) {
    const paddingX = label.classList.contains("screen-tag--line") ? 96 : 80;
    const paddingY = 42;
    const x = THREE.MathUtils.clamp(
      projected.x + offset.x,
      paddingX,
      Math.max(paddingX, refs.sceneMount.clientWidth - paddingX)
    );
    const y = THREE.MathUtils.clamp(
      projected.y + offset.y,
      paddingY,
      Math.max(paddingY, refs.sceneMount.clientHeight - paddingY)
    );
    label.style.left = `${x}px`;
    label.style.top = `${y}px`;
  }

  function projectWorldPosition(worldPosition) {
    const vector = worldPosition.clone().project(sceneObjects.camera);
    return {
      visible: vector.z > -1 && vector.z < 1 && !isOccludedByEarth(worldPosition),
      x: (vector.x * 0.5 + 0.5) * refs.sceneMount.clientWidth,
      y: (-vector.y * 0.5 + 0.5) * refs.sceneMount.clientHeight,
    };
  }

  function syncLayerVisibility() {
    if (appState.markers.rx && appState.markers.rx.group) {
      appState.markers.rx.group.visible = appState.layers.rx;
    }
    if (appState.markers.tx && appState.markers.tx.group) {
      appState.markers.tx.group.visible = appState.layers.tx;
    }

    if (sceneObjects.gridGroup) {
      sceneObjects.gridGroup.visible = appState.layers.grid;
    }
    if (sceneObjects.orbitLine) {
      sceneObjects.orbitLine.visible = appState.layers.orbit;
    }
    if (sceneObjects.debrisCloud) {
      sceneObjects.debrisCloud.visible = appState.layers.debris;
    }
    if (sceneObjects.debrisSpecks) {
      sceneObjects.debrisSpecks.visible = appState.layers.debris;
    }

    const showBaseline = appState.layers.links && appState.layers.tx && appState.layers.rx;
    const showTxIss = appState.layers.links && appState.layers.tx;
    const showIssRx = appState.layers.links && appState.layers.rx;
    setPathVisibility(sceneObjects.directLine, showBaseline);
    setPathVisibility(sceneObjects.txIssLine, showTxIss);
    setPathVisibility(sceneObjects.issRxLine, showIssRx);
  }

  function setPathVisibility(path, visible) {
    if (!path) {
      return;
    }
    path.line.visible = visible;
    path.glow.visible = visible;
    path.pulse.visible = visible;
  }

  function syncModeIndicators() {
    refs.modeBadge.textContent =
      appState.liveMode === "live" ? "Live ISS Feed" : appState.liveMode === "connecting" ? "Syncing ISS" : "Scripted Orbit";
    refs.storyBadge.textContent =
      PAGE_MODE === "dashboard" ? "Dashboard" : appState.storyMode ? "Guided Story" : "Explore";
    refs.selectionBadge.textContent = `Focus: ${appState.selectedEntity.toUpperCase()}`;
    updateStoryProgress();
    updateSectionNav();
    updateTelemetryRibbon();
  }

  function updateStoryStep(index, immediate) {
    const step = STORY_STEPS[index];
    appState.storyIndex = index;
    appState.storyMode = true;
    refs.storyCard.hidden = false;
    refs.storyStepTag.textContent = `Step ${index + 1} of ${STORY_STEPS.length}`;
    refs.storyTitle.textContent = step.title;
    refs.storyDescription.textContent = step.description;
    refs.nextStoryButton.textContent = index === STORY_STEPS.length - 1 ? "Enter Explore Mode" : "Next Step";
    setSelection(step.selection);
    setCameraTarget(resolveStoryCamera(step), immediate);
    openContentSection(step.panelKey);
    syncModeIndicators();
  }

  function resolveStoryCamera(step) {
    if (!appState.markers.rx || !appState.markers.tx || !appState.markers.iss) {
      return step.camera;
    }

    if (step.id === "baseline") {
      const corridor = midpoint(appState.markers.tx.stemTip, appState.markers.rx.stemTip)
        .normalize()
        .multiplyScalar(kilometersToSceneRadius(26));
      return getCameraFromTargetVector(corridor, 5.48, 0.95);
    }

    if (step.id === "bistatic") {
      const geometryCenter = appState.markers.tx.stemTip
        .clone()
        .add(appState.markers.rx.stemTip)
        .add(appState.markers.iss.stemTip)
        .multiplyScalar(1 / 3)
        .normalize()
        .multiplyScalar(kilometersToSceneRadius(190));
      return getCameraFromTargetVector(geometryCenter, 6.18, 1.02);
    }

    return step.camera;
  }

  function enterExploreMode() {
    appState.storyMode = false;
    refs.storyCard.hidden = true;
    openContentSection("aims");
    syncModeIndicators();
  }

  function restartStory() {
    updateStoryStep(0, true);
  }

  function openContentSection(sectionKey) {
    appState.visibleSection = sectionKey;
    refs.contentSections.querySelectorAll(".info-section").forEach((details) => {
      details.open = details.dataset.section === sectionKey || details.dataset.section === "math";
    });
    updateSectionNav();
  }

  function updateStoryProgress() {
    refs.storyProgress.querySelectorAll("[data-story-index]").forEach((button) => {
      const index = Number(button.dataset.storyIndex);
      button.classList.toggle("is-active", appState.storyMode && index === appState.storyIndex);
    });
  }

  function updateSectionNav() {
    document.querySelectorAll("[data-section-link]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.sectionLink === appState.visibleSection);
    });
  }

  function focusOnEntity(entityId) {
    const entity = appState.markers[entityId];
    if (!entity) {
      return;
    }

    if (entityId === "iss" && appState.displayedIssState) {
      setCameraTarget(getCameraFromTargetVector(entity.stemTip, 7.25, 1.04));
      return;
    }

    const cameraTarget = getCameraFromTargetVector(entity.stemTip, 5.8, 0.9);
    setCameraTarget(cameraTarget);
  }

  function setSelection(entityId) {
    appState.selectedEntity = entityId;

    Object.entries(appState.markers).forEach(([id, marker]) => {
      if (marker.cap) {
        marker.cap.scale.setScalar(id === entityId ? 1.4 : 1);
      }
      if (marker.body) {
        marker.body.scale.setScalar(id === entityId ? 1.3 : 1);
      }
    });

    syncModeIndicators();
  }

  function setCameraTarget(target, immediate) {
    appState.cameraTarget = { ...target };
    if (immediate) {
      appState.cameraCurrent = { ...target };
    }
  }

  async function requestLiveIssData(force) {
    const now = performance.now();
    if (!force && now < appState.nextLivePollAt) {
      return;
    }

    appState.nextLivePollAt = now + LIVE_POLL_INTERVAL_MS;
    if (appState.liveMode !== "live") {
      appState.liveMode = "connecting";
    }

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), LIVE_TIMEOUT_MS);
      const response = await fetch(`https://api.wheretheiss.at/v1/satellites/${ISS_NORAD_ID}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const payload = await response.json();
      appState.liveTargetState = {
        timestamp: Date.now(),
        lat: Number(payload.latitude),
        lon: Number(payload.longitude),
        altMeters: Number(payload.altitude) * 1000,
        velocityKmS: Number(payload.velocity) / 3600,
      };
      appState.liveMode = "live";
      appState.liveFailureReason = "";
    } catch (error) {
      appState.liveMode = "demo";
      appState.liveFailureReason = error && error.message ? error.message : "Live fetch failed";
    }
  }

  async function requestN2yoPassData(force) {
    if (PAGE_MODE !== "dashboard") {
      return;
    }

    const now = performance.now();
    if (!force && now < appState.nextN2yoPollAt) {
      return;
    }
    appState.nextN2yoPollAt = now + N2YO_PASS_POLL_INTERVAL_MS;

    const apiKey = getN2yoApiKey();
    if (!apiKey) {
      if (!applyBundledN2yoSnapshot()) {
        appState.n2yoMode = "missing-key";
        appState.n2yoPassSnapshot = null;
        appState.n2yoError = "N2YO API key not configured";
      }
      return;
    }

    appState.n2yoMode = "syncing";
    appState.n2yoError = "";

    try {
      const rxSite = SITE_CONFIGS.find((site) => site.id === "rx") || SITE_CONFIGS[0];
      const url =
        `${N2YO_API_BASE}/radiopasses/${ISS_NORAD_ID}/` +
        `${rxSite.lat}/${rxSite.lon}/${Math.round(rxSite.altMeters)}/` +
        `${N2YO_PASS_LOOKAHEAD_DAYS}/${N2YO_MIN_ELEVATION_DEGREES}/` +
        `&apiKey=${encodeURIComponent(apiKey)}`;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), N2YO_TIMEOUT_MS);
      const response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });
      window.clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`N2YO HTTP ${response.status}`);
      }

      const payload = await response.json();
      if (payload && payload.error) {
        throw new Error(payload.error);
      }

      applyN2yoPayload(payload, "live");
    } catch (error) {
      if (applyBundledN2yoSnapshot()) {
        appState.n2yoError = error && error.message ? error.message : "Browser N2YO fetch failed";
      } else {
        appState.n2yoMode = "error";
        appState.n2yoError = error && error.message ? error.message : "N2YO pass fetch failed";
      }
    }
  }

  function applyN2yoPayload(payload, mode) {
    const passes = Array.isArray(payload && payload.passes) ? payload.passes.map(normalizeN2yoPass) : [];
    appState.n2yoPassSnapshot = {
      info: payload && payload.info ? payload.info : {},
      passes,
      updatedAt: Date.now(),
    };
    appState.n2yoMode = passes.length ? mode : "empty";
    return passes.length > 0;
  }

  function applyBundledN2yoSnapshot() {
    const payload = window.SUPR_N2YO_PASSES_SNAPSHOT || window.UPR_N2YO_PASSES_SNAPSHOT;
    if (!payload || !Array.isArray(payload.passes)) {
      return false;
    }
    const nowSeconds = Date.now() / 1000;
    const hasUpcomingPass = payload.passes.some((pass) => finiteOrFallback(pass.endUTC, 0) > nowSeconds - 60);
    if (!hasUpcomingPass) {
      appState.n2yoMode = "stale";
      return false;
    }
    return applyN2yoPayload(payload, "cached");
  }

  function normalizeN2yoPass(pass) {
    return {
      startUTC: Number(pass.startUTC),
      maxUTC: Number(pass.maxUTC),
      endUTC: Number(pass.endUTC),
      startAz: Number(pass.startAz),
      maxAz: Number(pass.maxAz),
      endAz: Number(pass.endAz),
      startAzCompass: pass.startAzCompass || "",
      maxAzCompass: pass.maxAzCompass || "",
      endAzCompass: pass.endAzCompass || "",
      maxEl: Number(pass.maxEl),
      duration: Number(pass.duration),
    };
  }

  async function requestOrbitsmithData(force) {
    const now = performance.now();
    if (!force && now < appState.nextOrbitsmithPollAt) {
      return;
    }
    appState.nextOrbitsmithPollAt = now + ORBITSMITH_POLL_INTERVAL_MS;
    if (appState.orbitsmithMode !== "live") {
      appState.orbitsmithMode = "syncing";
      updateLeoDataPanel();
    }

    try {
      const [catalogPayload, conjunctionPayload, reentryPayload] = await Promise.all([
        fetchOrbitsmithJson("/catalog"),
        fetchOrbitsmithJson("/conjunctions"),
        fetchOrbitsmithJson("/reentry"),
      ]);
      appState.orbitsmithSnapshot = buildOrbitsmithSnapshot(
        catalogPayload,
        conjunctionPayload,
        reentryPayload
      );
      appState.orbitsmithMode = "live";
      appState.orbitsmithError = "";
    } catch (error) {
      appState.orbitsmithMode = "fallback";
      appState.orbitsmithError = error && error.message ? error.message : "OrbitSmith feed unavailable";
      appState.orbitsmithSnapshot = appState.orbitsmithSnapshot || { ...ORBITSMITH_FALLBACK_SNAPSHOT };
    }

    updateLeoDataPanel();
    updateTelemetryRibbon();
  }

  async function fetchOrbitsmithJson(endpoint) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), ORBITSMITH_TIMEOUT_MS);
    try {
      const response = await fetch(`${ORBITSMITH_API_BASE}${endpoint}`, {
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`OrbitSmith ${endpoint} HTTP ${response.status}`);
      }
      return response.json();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function requestLeoLabsData(force) {
    const now = performance.now();
    if (!force && now < appState.nextLeolabsPollAt) {
      return;
    }
    appState.nextLeolabsPollAt = now + LEOLABS_POLL_INTERVAL_MS;
    if (appState.leolabsMode !== "live") {
      appState.leolabsMode = "syncing";
      updateLeoDataPanel();
    }

    try {
      const metricsPage = await fetchLeoLabsMetricsPage();
      const parsedSnapshot = parseLeoLabsMetrics(metricsPage);
      appState.leolabsSnapshot = {
        ...LEOLABS_FALLBACK_SNAPSHOT,
        ...parsedSnapshot,
        source: "LeoLabs System Metrics",
        updatedIso: new Date().toISOString(),
      };
      appState.leolabsMode = "live";
      appState.leolabsError = "";
    } catch (error) {
      appState.leolabsMode = "fallback";
      appState.leolabsError = error && error.message ? error.message : "LeoLabs metrics unavailable";
      appState.leolabsSnapshot = appState.leolabsSnapshot || { ...LEOLABS_FALLBACK_SNAPSHOT };
    }

    updateLeoDataPanel();
    updateTelemetryRibbon();
  }

  async function fetchLeoLabsMetricsPage() {
    let lastError = null;
    for (let index = 0; index < LEOLABS_METRICS_URLS.length; index += 1) {
      const url = LEOLABS_METRICS_URLS[index];
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), LEOLABS_TIMEOUT_MS);
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`LeoLabs metrics HTTP ${response.status}`);
        }
        const text = await response.text();
        if (typeof text === "string" && text.includes("System Metrics")) {
          return text;
        }
        throw new Error("LeoLabs metrics page format changed");
      } catch (error) {
        lastError = error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    }

    throw lastError || new Error("LeoLabs metrics unavailable");
  }

  function parseLeoLabsMetrics(metricsHtml) {
    const normalized = String(metricsHtml || "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const objects = extractMatchNumber(normalized, /Objects\s+([0-9][0-9,]*)/i);
    const radarPasses = extractMatchNumber(normalized, /Radar Passes\s+([0-9][0-9,]*)/i);
    const measurements = extractMatchNumber(normalized, /Measurements\s+([0-9][0-9,]*)/i);
    const stateVectors = extractMatchNumber(normalized, /State Vectors\s+([0-9][0-9,]*)/i);
    const screenings = extractMatchNumber(
      normalized,
      /Operational Ephemeris Screenings\s+([0-9][0-9,]*)/i
    );
    const latencyMinutes = extractMatchNumber(
      normalized,
      /Time - Radar Pass to State Vector\s+([0-9]+(?:\.[0-9]+)?)\s*min/i
    );
    const accuracyMeters = extractMatchNumber(
      normalized,
      /Difference between LeoLabs & truth data\s+([0-9]+(?:\.[0-9]+)?)\s*meters/i
    );
    const precisionMeters = extractMatchNumber(
      normalized,
      /RMS Uncertainty\s+([0-9]+(?:\.[0-9]+)?)\s*meters/i
    );

    return {
      objects: finiteOrFallback(objects, LEOLABS_FALLBACK_SNAPSHOT.objects),
      latencyMinutes: finiteOrFallback(latencyMinutes, LEOLABS_FALLBACK_SNAPSHOT.latencyMinutes),
      accuracyMeters: finiteOrFallback(accuracyMeters, LEOLABS_FALLBACK_SNAPSHOT.accuracyMeters),
      precisionMeters: finiteOrFallback(precisionMeters, LEOLABS_FALLBACK_SNAPSHOT.precisionMeters),
      radarPasses: finiteOrFallback(radarPasses, LEOLABS_FALLBACK_SNAPSHOT.radarPasses),
      measurements: finiteOrFallback(measurements, LEOLABS_FALLBACK_SNAPSHOT.measurements),
      stateVectors: finiteOrFallback(stateVectors, LEOLABS_FALLBACK_SNAPSHOT.stateVectors),
      screenings: finiteOrFallback(screenings, LEOLABS_FALLBACK_SNAPSHOT.screenings),
    };
  }

  function buildOrbitsmithSnapshot(catalogPayload, conjunctionPayload, reentryPayload) {
    const catalogStats =
      catalogPayload && typeof catalogPayload === "object" && catalogPayload.stats
        ? catalogPayload.stats
        : {};
    const catalogObjects = Array.isArray(catalogPayload && catalogPayload.objects)
      ? catalogPayload.objects
      : [];
    const conjunctions = Array.isArray(conjunctionPayload && conjunctionPayload.conjunctions)
      ? conjunctionPayload.conjunctions
      : [];
    const reentryPredictions = Array.isArray(reentryPayload && reentryPayload.predictions)
      ? reentryPayload.predictions
      : [];
    const catalogTypeCounts = countCatalogObjectTypes(catalogObjects);

    const riskSplit = classifyConjunctionRisks(conjunctions);
    const [issTleLine1, issTleLine2] = extractIssTle(catalogObjects);
    const trackedObjects = positiveOrFallback(
      catalogStats.total,
      catalogObjects.length || ORBITSMITH_FALLBACK_SNAPSHOT.trackedObjects
    );
    const satellites = positiveOrFallback(
      catalogStats.payload,
      catalogTypeCounts.satellites || ORBITSMITH_FALLBACK_SNAPSHOT.satellites
    );
    const rocketBodies = positiveOrFallback(
      catalogStats.rocketBody,
      catalogTypeCounts.rocketBodies || ORBITSMITH_FALLBACK_SNAPSHOT.rocketBodies
    );
    const debris = positiveOrFallback(
      catalogStats.debris,
      catalogTypeCounts.debris || ORBITSMITH_FALLBACK_SNAPSHOT.debris
    );
    const unknown = Math.max(
      positiveOrFallback(catalogStats.unknown, catalogTypeCounts.unknown || ORBITSMITH_FALLBACK_SNAPSHOT.unknown),
      trackedObjects - satellites - rocketBodies - debris
    );
    const latestIso =
      pickLatestIso(catalogPayload && catalogPayload.updated, conjunctionPayload && conjunctionPayload.updated, reentryPayload && reentryPayload.updated) ||
      ORBITSMITH_FALLBACK_SNAPSHOT.updatedIso;

    return {
      trackedObjects,
      satellites,
      rocketBodies,
      debris,
      unknown,
      leoObjects: positiveOrFallback(catalogStats.leo, ORBITSMITH_FALLBACK_SNAPSHOT.leoObjects),
      activeConjunctions24h: finiteOrFallback(
        conjunctionPayload && conjunctionPayload.count,
        conjunctions.length
      ),
      riskCritical: riskSplit.critical,
      riskHigh: riskSplit.high,
      riskModerate: riskSplit.moderate,
      riskLow: riskSplit.low,
      riskNoPc: riskSplit.noPc,
      upcomingReentries: reentryPredictions.length,
      source: "Space-Track snapshots via OrbitSmith",
      updatedIso: latestIso,
      issTleLine1: issTleLine1 || ORBITSMITH_FALLBACK_SNAPSHOT.issTleLine1,
      issTleLine2: issTleLine2 || ORBITSMITH_FALLBACK_SNAPSHOT.issTleLine2,
    };
  }

  function classifyConjunctionRisks(conjunctions) {
    const split = { critical: 0, high: 0, moderate: 0, low: 0, noPc: 0 };
    conjunctions.forEach((item) => {
      const probability = Number(item && item.prob);
      if (!Number.isFinite(probability) || probability <= 0) {
        split.noPc += 1;
        return;
      }
      if (probability >= 1e-3) {
        split.critical += 1;
      } else if (probability >= 1e-4) {
        split.high += 1;
      } else if (probability >= 1e-5) {
        split.moderate += 1;
      } else if (probability >= 1e-7) {
        split.low += 1;
      } else {
        split.noPc += 1;
      }
    });
    return split;
  }

  function countCatalogObjectTypes(catalogObjects) {
    const counts = {
      satellites: 0,
      rocketBodies: 0,
      debris: 0,
      unknown: 0,
    };

    catalogObjects.forEach((item) => {
      const rawType = Array.isArray(item) ? item[2] : item && (item.type ?? item.objectType ?? item.category);
      const normalizedType = String(rawType).toLowerCase();
      if (rawType === 0 || normalizedType.includes("payload") || normalizedType.includes("sat")) {
        counts.satellites += 1;
      } else if (rawType === 1 || normalizedType.includes("rocket")) {
        counts.rocketBodies += 1;
      } else if (rawType === 2 || normalizedType.includes("deb")) {
        counts.debris += 1;
      } else {
        counts.unknown += 1;
      }
    });

    return counts;
  }

  function extractIssTle(catalogObjects) {
    for (let index = 0; index < catalogObjects.length; index += 1) {
      const row = catalogObjects[index];
      if (!Array.isArray(row)) {
        continue;
      }
      const id = String(row[0] || "");
      const name = String(row[1] || "").toUpperCase();
      if (id !== String(ISS_NORAD_ID) && !name.includes("ISS")) {
        continue;
      }
      const line1 = row[12] ? String(row[12]) : "";
      const line2 = row[13] ? String(row[13]) : "";
      return [line1, line2];
    }
    return ["", ""];
  }

  function pickLatestIso(...values) {
    return values
      .filter((value) => typeof value === "string" && Number.isFinite(Date.parse(value)))
      .sort((left, right) => Date.parse(right) - Date.parse(left))[0];
  }

  function updateLeoDataPanel() {
    if (!refs.leoTrackedValue) {
      return;
    }

    const orbitModel = appState.orbitsmithSnapshot || ORBITSMITH_FALLBACK_SNAPSHOT;
    const leolabsModel = appState.leolabsSnapshot || LEOLABS_FALLBACK_SNAPSHOT;
    const catalogSegments = [
      { label: "Satellites", value: orbitModel.satellites, color: ORBITSMITH_COLORS.catalog.satellites },
      { label: "Rocket Bodies", value: orbitModel.rocketBodies, color: ORBITSMITH_COLORS.catalog.rocketBodies },
      { label: "Debris", value: orbitModel.debris, color: ORBITSMITH_COLORS.catalog.debris },
      { label: "Other/Unknown", value: orbitModel.unknown, color: ORBITSMITH_COLORS.catalog.unknown },
    ];
    const riskSegments = [
      { label: "Critical (>=1e-3)", value: orbitModel.riskCritical, color: ORBITSMITH_COLORS.risk.critical },
      { label: "High (1e-4 to 1e-3)", value: orbitModel.riskHigh, color: ORBITSMITH_COLORS.risk.high },
      { label: "Moderate (1e-5 to 1e-4)", value: orbitModel.riskModerate, color: ORBITSMITH_COLORS.risk.moderate },
      { label: "Low (1e-7 to 1e-5)", value: orbitModel.riskLow, color: ORBITSMITH_COLORS.risk.low },
      { label: "No PC Data", value: orbitModel.riskNoPc, color: ORBITSMITH_COLORS.risk.noPc },
    ];
    const riskTotal = riskSegments.reduce((sum, segment) => sum + segment.value, 0);
    const orbitLabel = appState.orbitsmithMode === "live" ? "OrbitSmith Live" : appState.orbitsmithMode === "syncing" ? "OrbitSmith Syncing" : "OrbitSmith Snapshot";
    const leolabsLabel = appState.leolabsMode === "live" ? "LeoLabs Live" : appState.leolabsMode === "syncing" ? "LeoLabs Syncing" : "LeoLabs Snapshot";
    const orbitUpdatedLabel = orbitModel.updatedIso
      ? new Date(orbitModel.updatedIso).toLocaleString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "unknown";
    const leolabsUpdatedLabel = leolabsModel.updatedIso
      ? new Date(leolabsModel.updatedIso).toLocaleString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : "unknown";

    setNodeText(refs.leoFeedTag, `${orbitLabel} + ${leolabsLabel}`);
    setNodeText(refs.leoTrackedValue, formatInteger(orbitModel.trackedObjects));
    setNodeText(refs.leoLeoBandValue, formatInteger(orbitModel.leoObjects));
    setNodeText(refs.leoDebrisValue, formatInteger(orbitModel.debris));
    setNodeText(refs.leoConjunctionValue, formatInteger(orbitModel.activeConjunctions24h));
    setNodeText(refs.leoCriticalValue, formatInteger(orbitModel.riskCritical));
    setNodeText(refs.leoReentryValue, formatInteger(orbitModel.upcomingReentries));

    setNodeText(refs.leolabsObjectsValue, formatInteger(leolabsModel.objects));
    setNodeText(refs.leolabsLatencyValue, `${formatCompactNumber(leolabsModel.latencyMinutes)} min`);
    setNodeText(refs.leolabsAccuracyValue, `${formatCompactNumber(leolabsModel.accuracyMeters)} m`);
    setNodeText(refs.leolabsPrecisionValue, `${formatCompactNumber(leolabsModel.precisionMeters)} m`);

    setNodeText(refs.leoCatalogCenter, formatInteger(orbitModel.trackedObjects));
    setNodeText(refs.leoRiskCenter, formatInteger(riskTotal));
    if (refs.leoCatalogDonut) {
      refs.leoCatalogDonut.style.background = createDonutGradient(catalogSegments);
    }
    if (refs.leoRiskDonut) {
      refs.leoRiskDonut.style.background = createDonutGradient(riskSegments);
    }
    setNodeHtml(refs.leoCatalogLegend, buildLegendMarkup(catalogSegments, orbitModel.trackedObjects));
    setNodeHtml(refs.leoRiskLegend, buildLegendMarkup(riskSegments, riskTotal));

    setNodeText(refs.issTleLine1, orbitModel.issTleLine1 || "TLE line 1 unavailable");
    setNodeText(refs.issTleLine2, orbitModel.issTleLine2 || "TLE line 2 unavailable");
    setNodeText(
      refs.leoSourceMeta,
      `Orbit feed: ${orbitModel.source || "OrbitSmith"} (${orbitUpdatedLabel}) | LeoLabs: ${leolabsModel.source || "System Metrics"} (${leolabsUpdatedLabel})`
    );

    updateLeoLabsTrend(leolabsModel);
    updateLeoLabsPerformanceBars(leolabsModel);
    setNodeHtml(refs.leolabsCoverageBadges, buildCoverageBadgeMarkup());
    setNodeText(
      refs.leoDashboardMeta,
      `LeoLabs reference coverage reports ${LEOLABS_COVERAGE_REFERENCE.catalogCoveragePct}% of the U.S. public catalog, including ${LEOLABS_COVERAGE_REFERENCE.debrisCoveragePct}% of debris objects.`
    );
  }

  function updateLeoLabsTrend(leolabsModel) {
    const trendPoints = LEOLABS_HISTORY_POINTS.map((point) => ({
      label: point.label,
      objects: point.objects,
    }));
    const latestLabel = formatMonthLabel(leolabsModel.updatedIso || Date.now());
    const previousPoint = trendPoints[trendPoints.length - 1];
    if (!previousPoint || Math.abs(previousPoint.objects - leolabsModel.objects) > 1) {
      trendPoints.push({
        label: latestLabel,
        objects: leolabsModel.objects,
      });
    }

    setNodeHtml(refs.leoTrendSvg, buildTrendSvgMarkup(trendPoints));
    const base = trendPoints[0] ? trendPoints[0].objects : leolabsModel.objects;
    const delta = leolabsModel.objects - base;
    const deltaPct = base > 0 ? (delta / base) * 100 : 0;
    const sign = delta >= 0 ? "+" : "";
    setNodeText(refs.leoTrendDelta, `${sign}${formatInteger(delta)} objects (${sign}${deltaPct.toFixed(1)}%)`);
    const fromLabel = trendPoints[0] ? trendPoints[0].label : latestLabel;
    const toLabel = trendPoints[trendPoints.length - 1] ? trendPoints[trendPoints.length - 1].label : latestLabel;
    setNodeText(refs.leoTrendCaption, `${fromLabel} to ${toLabel} based on public LeoLabs snapshots.`);
  }

  function buildTrendSvgMarkup(points) {
    if (!points || points.length === 0) {
      return "";
    }

    const width = 420;
    const height = 160;
    const padding = { top: 16, right: 14, bottom: 34, left: 14 };
    const minValue = Math.min(...points.map((point) => point.objects));
    const maxValue = Math.max(...points.map((point) => point.objects));
    const valueRange = Math.max(maxValue - minValue, 1);
    const usableWidth = width - padding.left - padding.right;
    const usableHeight = height - padding.top - padding.bottom;

    const mapped = points.map((point, index) => {
      const x =
        padding.left + (usableWidth * index) / Math.max(points.length - 1, 1);
      const y =
        padding.top + usableHeight - ((point.objects - minValue) / valueRange) * usableHeight;
      return {
        ...point,
        x,
        y,
      };
    });

    const polyline = mapped.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
    const areaPath = [
      `M ${mapped[0].x.toFixed(2)} ${padding.top + usableHeight}`,
      ...mapped.map((point) => `L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
      `L ${mapped[mapped.length - 1].x.toFixed(2)} ${padding.top + usableHeight}`,
      "Z",
    ].join(" ");

    const dots = mapped
      .map(
        (point) =>
          `<circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3.2"></circle>`
      )
      .join("");

    const labels = mapped
      .map(
        (point) =>
          `<text x="${point.x.toFixed(2)}" y="${(height - 10).toFixed(2)}" text-anchor="middle">${point.label}</text>`
      )
      .join("");

    return `
      <svg viewBox="0 0 ${width} ${height}" class="trend-chart">
        <path class="trend-area" d="${areaPath}"></path>
        <polyline class="trend-line" points="${polyline}"></polyline>
        ${dots}
        ${labels}
      </svg>
    `;
  }

  function updateLeoLabsPerformanceBars(leolabsModel) {
    const rows = [
      {
        label: "Objects",
        value: leolabsModel.objects,
        max: 32000,
        display: formatInteger(leolabsModel.objects),
      },
      {
        label: "Radar Passes",
        value: leolabsModel.radarPasses,
        max: 6000000,
        display: formatInteger(leolabsModel.radarPasses),
      },
      {
        label: "Measurements",
        value: leolabsModel.measurements,
        max: 120000000,
        display: formatInteger(leolabsModel.measurements),
      },
      {
        label: "State Vectors",
        value: leolabsModel.stateVectors,
        max: 6000000,
        display: formatInteger(leolabsModel.stateVectors),
      },
      {
        label: "OE Screenings",
        value: leolabsModel.screenings,
        max: 2200000,
        display: formatInteger(leolabsModel.screenings),
      },
    ];

    setNodeHtml(
      refs.leolabsPerfBars,
      rows
        .map((row) => {
          const widthPct = Math.min((row.value / row.max) * 100, 100);
          return `
            <div class="perf-row">
              <span>${row.label}</span>
              <div class="perf-bar-track"><i style="width:${widthPct.toFixed(1)}%"></i></div>
              <strong>${row.display}</strong>
            </div>
          `;
        })
        .join("")
    );
  }

  function buildCoverageBadgeMarkup() {
    const coverage = [
      {
        label: "Catalog Coverage",
        value: `${LEOLABS_COVERAGE_REFERENCE.catalogCoveragePct}%`,
      },
      {
        label: "Satellite Coverage",
        value: `${LEOLABS_COVERAGE_REFERENCE.satelliteCoveragePct}%`,
      },
      {
        label: "Debris Coverage",
        value: `${LEOLABS_COVERAGE_REFERENCE.debrisCoveragePct}%`,
      },
      {
        label: "Resident Objects",
        value: `~${formatInteger(LEOLABS_COVERAGE_REFERENCE.residentObjectsApprox)}`,
      },
    ];

    return coverage
      .map(
        (item) => `
          <div class="coverage-badge">
            <span>${item.label}</span>
            <strong>${item.value}</strong>
          </div>
        `
      )
      .join("");
  }

  function createDonutGradient(segments) {
    const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
    if (!total) {
      return "conic-gradient(#2b4257 0deg, #2b4257 360deg)";
    }

    let currentAngle = 0;
    const stops = segments
      .filter((segment) => segment.value > 0)
      .map((segment) => {
        const span = (segment.value / total) * 360;
        const from = currentAngle;
        currentAngle += span;
        return `${segment.color} ${from.toFixed(2)}deg ${currentAngle.toFixed(2)}deg`;
      });
    return `conic-gradient(${stops.join(",")})`;
  }

  function buildLegendMarkup(segments, total) {
    const safeTotal = total > 0 ? total : 1;
    return segments
      .map((segment) => {
        const percent = (segment.value / safeTotal) * 100;
        return `
          <div class="leo-legend__row">
            <span class="leo-legend__label">
              <i class="leo-swatch" style="background:${segment.color}"></i>
              ${segment.label}
            </span>
            <strong>${formatInteger(segment.value)} (${percent.toFixed(0)}%)</strong>
          </div>
        `;
      })
      .join("");
  }

  function getScriptedIssState(simSeconds) {
    const theta = ((simSeconds % ORBIT_PERIOD_SECONDS) / ORBIT_PERIOD_SECONDS) * Math.PI * 2 + degreesToRadians(24);
    const position = new THREE.Vector3(
      Math.cos(theta) * kilometersToSceneRadius(418),
      0,
      Math.sin(theta) * kilometersToSceneRadius(418)
    );

    position.applyAxisAngle(new THREE.Vector3(1, 0, 0), degreesToRadians(51.64));
    position.applyAxisAngle(new THREE.Vector3(0, 1, 0), degreesToRadians(34 + (simSeconds / ORBIT_PERIOD_SECONDS) * 6));

    return {
      timestamp: Date.now(),
      lat: radiansToDegrees(Math.asin(position.y / position.length())),
      lon: radiansToDegrees(Math.atan2(position.z, position.x)),
      altMeters: 418000,
      velocityKmS: 7.66,
    };
  }

  function computeMetrics(txPosition, rxPosition, issPosition) {
    const baselineKm = sceneDistanceToKilometers(txPosition.distanceTo(rxPosition));
    const txToIssKm = sceneDistanceToKilometers(txPosition.distanceTo(issPosition));
    const issToRxKm = sceneDistanceToKilometers(issPosition.distanceTo(rxPosition));
    const totalPathKm = txToIssKm + issToRxKm;
    const excessPathKm = Math.max(totalPathKm - baselineKm, 0);
    const delayMicroseconds = (excessPathKm * 1000 / SPEED_OF_LIGHT_M_PER_S) * 1e6;

    /** @type {MetricsModel} */
    return {
      baselineKm,
      txToIssKm,
      issToRxKm,
      totalPathKm,
      excessPathKm,
      delayMicroseconds,
      labels: {
        baseline: formatDistance(baselineKm),
        txToIss: formatDistance(txToIssKm),
        issToRx: formatDistance(issToRxKm),
        totalPath: formatDistance(totalPathKm),
        excessPath: formatDistance(excessPathKm),
        delay: `${delayMicroseconds.toFixed(2)} us`,
      },
    };
  }

  function onResize() {
    const width = refs.sceneMount.clientWidth;
    const height = refs.sceneMount.clientHeight;
    sceneObjects.camera.aspect = width / height;
    sceneObjects.camera.updateProjectionMatrix();
    sceneObjects.renderer.setPixelRatio(getScenePixelRatio());
    sceneObjects.renderer.setSize(width, height);
  }

  function isPhoneViewport() {
    return PHONE_MEDIA_QUERY ? PHONE_MEDIA_QUERY.matches : window.innerWidth <= 700;
  }

  function getScenePixelRatio() {
    return Math.min(window.devicePixelRatio || 1, isPhoneViewport() ? 1.35 : 2);
  }

  function createEarthTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 512;
    const context = canvas.getContext("2d");

    const background = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    background.addColorStop(0, "#081829");
    background.addColorStop(0.5, "#103252");
    background.addColorStop(1, "#091522");
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    for (let index = 0; index < 220; index += 1) {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      const width = Math.random() * 110 + 30;
      const height = Math.random() * 30 + 10;
      context.fillStyle = `rgba(41, 115, 145, ${Math.random() * 0.14})`;
      context.beginPath();
      context.ellipse(x, y, width, height, Math.random() * Math.PI, 0, Math.PI * 2);
      context.fill();
    }

    context.strokeStyle = "rgba(103, 237, 255, 0.08)";
    context.lineWidth = 1;
    for (let lon = 0; lon <= canvas.width; lon += 64) {
      context.beginPath();
      context.moveTo(lon, 0);
      context.lineTo(lon, canvas.height);
      context.stroke();
    }

    for (let lat = 0; lat <= canvas.height; lat += 64) {
      context.beginPath();
      context.moveTo(0, lat);
      context.lineTo(canvas.width, lat);
      context.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = 4;
    return texture;
  }

  function latLonAltToVector3(latDeg, lonDeg, altMeters) {
    const radius = kilometersToSceneRadius((altMeters || 0) / 1000);
    const lat = degreesToRadians(latDeg);
    const lon = degreesToRadians(-lonDeg);
    return new THREE.Vector3(
      radius * Math.cos(lat) * Math.cos(lon),
      radius * Math.sin(lat),
      radius * Math.cos(lat) * Math.sin(lon)
    );
  }

  function midpoint(a, b) {
    return a.clone().lerp(b, 0.5);
  }

  function kilometersToSceneRadius(altitudeKm) {
    return EARTH_RADIUS_SCENE * (1 + altitudeKm / EARTH_RADIUS_KM);
  }

  function sceneDistanceToKilometers(distance) {
    return (distance / EARTH_RADIUS_SCENE) * EARTH_RADIUS_KM;
  }

  function setNodeText(node, value) {
    if (!node) {
      return;
    }
    node.textContent = value;
  }

  function setNodeHtml(node, value) {
    if (!node) {
      return;
    }
    node.innerHTML = value;
  }

  function formatCompactNumber(value) {
    const numeric = finiteOrFallback(value, 0);
    return numeric.toLocaleString(undefined, {
      minimumFractionDigits: Number.isInteger(numeric) ? 0 : 1,
      maximumFractionDigits: Number.isInteger(numeric) ? 0 : 1,
    });
  }

  function formatMonthLabel(timestamp) {
    const parsed = Date.parse(timestamp);
    const date = Number.isFinite(parsed) ? new Date(parsed) : new Date();
    return date.toLocaleString([], {
      month: "short",
      year: "numeric",
    });
  }

  function extractMatchNumber(text, regex) {
    const match = String(text || "").match(regex);
    if (!match || typeof match[1] === "undefined") {
      return Number.NaN;
    }
    return parseLooseNumber(match[1]);
  }

  function parseLooseNumber(value) {
    const normalized = String(value || "").replace(/,/g, "").trim();
    return Number(normalized);
  }

  function finiteOrFallback(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function positiveOrFallback(value, fallback) {
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric > 0 ? numeric : fallback;
  }

  function formatInteger(value) {
    return Math.round(finiteOrFallback(value, 0)).toLocaleString();
  }

  function formatDistance(distanceKm) {
    return `${distanceKm.toLocaleString(undefined, {
      maximumFractionDigits: distanceKm >= 1000 ? 0 : 1,
    })} km`;
  }

  function formatDuration(totalSeconds) {
    const safeSeconds = Math.max(0, Math.round(finiteOrFallback(totalSeconds, 0)));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const seconds = safeSeconds % 60;
    return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
  }

  function formatPassWindow(secondsToClosest) {
    const closestTime = Date.now() + Math.max(0, finiteOrFallback(secondsToClosest, 0)) * 1000;
    const start = new Date(closestTime - 6 * 60 * 1000);
    const end = new Date(closestTime + 6 * 60 * 1000);
    return formatTimeRange(start.getTime(), end.getTime());
  }

  function formatTimeRange(startMs, endMs) {
    const options = { hour: "2-digit", minute: "2-digit" };
    return `${new Date(startMs).toLocaleTimeString([], options)} - ${new Date(endMs).toLocaleTimeString([], options)}`;
  }

  function formatAzimuth(degrees, compass) {
    const numeric = finiteOrFallback(degrees, Number.NaN);
    const numericLabel = Number.isFinite(numeric) ? `${numeric.toFixed(0)} deg` : "-- deg";
    return compass ? `${compass} ${numericLabel}` : numericLabel;
  }

  function formatCoordinatePair(site) {
    const latHemisphere = site.lat >= 0 ? "N" : "S";
    const lonHemisphere = site.lon >= 0 ? "E" : "W";
    return `${Math.abs(site.lat).toFixed(6)} ${latHemisphere}, ${Math.abs(site.lon).toFixed(5)} ${lonHemisphere}`;
  }

  function getN2yoApiKey() {
    if (window.SUPR_N2YO_API_KEY && String(window.SUPR_N2YO_API_KEY).trim()) {
      return String(window.SUPR_N2YO_API_KEY).trim();
    }
    if (window.UPR_N2YO_API_KEY && String(window.UPR_N2YO_API_KEY).trim()) {
      return String(window.UPR_N2YO_API_KEY).trim();
    }
    try {
      return String(
        window.localStorage.getItem("suprN2yoApiKey") ||
          window.localStorage.getItem("uprN2yoApiKey") ||
          ""
      ).trim();
    } catch (error) {
      return "";
    }
  }

  function formatTelemetryTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }

  function degreesToRadians(value) {
    return value * (Math.PI / 180);
  }

  function radiansToDegrees(value) {
    return value * (180 / Math.PI);
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function isOccludedByEarth(worldPosition) {
    const cameraPosition = sceneObjects.camera.position.clone();
    const direction = worldPosition.clone().sub(cameraPosition);
    const pointDistance = direction.length();
    direction.normalize();

    const b = 2 * cameraPosition.dot(direction);
    const c = cameraPosition.lengthSq() - (EARTH_RADIUS_SCENE * 0.995) ** 2;
    const discriminant = b * b - 4 * c;
    if (discriminant <= 0) {
      return false;
    }

    const hitDistance = (-b - Math.sqrt(discriminant)) / 2;
    return hitDistance > 0 && hitDistance < pointDistance - 0.02;
  }

  function shortestLongitudeLerp(start, end, alpha) {
    let delta = end - start;
    if (delta > 180) {
      delta -= 360;
    } else if (delta < -180) {
      delta += 360;
    }
    return start + delta * alpha;
  }

  function getCameraFromTargetVector(targetVector, distance, elevationOffset) {
    const surfaceNormal = targetVector.clone().normalize();
    const east = new THREE.Vector3(-surfaceNormal.z, 0, surfaceNormal.x);
    if (east.lengthSq() < 1e-5) {
      east.set(1, 0, 0);
    }
    east.normalize();

    const cameraVector = surfaceNormal
      .clone()
      .multiplyScalar(distance)
      .add(east.multiplyScalar(distance * 0.12));
    cameraVector.y += elevationOffset;
    cameraVector.normalize().multiplyScalar(distance);
    const polar = Math.acos(THREE.MathUtils.clamp(cameraVector.y / distance, -1, 1));
    const azimuth = Math.atan2(cameraVector.x, cameraVector.z);
    return {
      azimuth,
      polar,
      distance,
    };
  }
})();
