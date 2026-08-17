(() => {
  const STORAGE_KEY = 'orovian-look-settings-v1';
  const DEFAULTS = Object.freeze({ brightness: 100, color: 100, depth: 100, shade: 100 });
  const PRESETS = Object.freeze({
    soft: { brightness: 104, color: 96, depth: 92, shade: 118 },
    balanced: { ...DEFAULTS },
    vivid: { brightness: 106, color: 116, depth: 108, shade: 110 },
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const normalizeSettings = (incoming = {}) => ({
    brightness: clamp(Number(incoming.brightness) || DEFAULTS.brightness, 70, 135),
    color: clamp(Number(incoming.color) || DEFAULTS.color, 70, 140),
    depth: clamp(Number(incoming.depth) || DEFAULTS.depth, 75, 135),
    shade: clamp(Number(incoming.shade) || DEFAULTS.shade, 80, 140),
  });

  const readStored = () => {
    try {
      return normalizeSettings(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
    } catch {
      return { ...DEFAULTS };
    }
  };

  const writeStored = settings => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  };

  const labelMap = {
    brightness: 'Brightness',
    color: 'Color',
    depth: 'Depth',
    shade: 'Shade',
  };

  function makeFilter(settings) {
    const brightness = settings.brightness / 100;
    const saturation = settings.color / 100;
    const contrastBase = settings.depth / 100;
    const shadeOffset = (settings.shade - 100) / 100;
    const finalBrightness = clamp(brightness * (1 + Math.max(0, shadeOffset) * 0.18), 0.72, 1.5);
    const finalContrast = clamp(contrastBase * (1 - shadeOffset * 0.22), 0.72, 1.45);
    const finalSaturation = clamp(saturation * (1 - Math.max(0, shadeOffset) * 0.03), 0.72, 1.55);
    return `brightness(${finalBrightness.toFixed(3)}) contrast(${finalContrast.toFixed(3)}) saturate(${finalSaturation.toFixed(3)})`;
  }

  function setup() {
    const canvas = document.getElementById('gl');
    const lookPanel = document.getElementById('lookPanel');
    const toggle = document.getElementById('toggleLook');
    if (!canvas || !lookPanel || !toggle) return;

    const inputs = {
      brightness: document.getElementById('lookBrightness'),
      color: document.getElementById('lookColor'),
      depth: document.getElementById('lookDepth'),
      shade: document.getElementById('lookShade'),
    };
    const valueNodes = {
      brightness: document.getElementById('lookBrightnessValue'),
      color: document.getElementById('lookColorValue'),
      depth: document.getElementById('lookDepthValue'),
      shade: document.getElementById('lookShadeValue'),
    };
    const presetButtons = Array.from(lookPanel.querySelectorAll('[data-look-preset]'));
    const resetButton = document.getElementById('lookReset');

    let settings = readStored();

    const refreshPresetState = () => {
      presetButtons.forEach(button => {
        const preset = PRESETS[button.dataset.lookPreset];
        const matches = preset && Object.keys(DEFAULTS).every(key => settings[key] === preset[key]);
        button.classList.toggle('active', !!matches);
      });
    };

    const render = () => {
      canvas.style.filter = makeFilter(settings);
      Object.entries(inputs).forEach(([key, node]) => {
        if (node) node.value = settings[key];
        if (valueNodes[key]) valueNodes[key].textContent = `${settings[key]}%`;
      });
      refreshPresetState();
      writeStored(settings);
    };

    const setPanelOpen = open => {
      toggle.classList.toggle('active', open);
      toggle.setAttribute('aria-pressed', open ? 'true' : 'false');
      lookPanel.classList.toggle('open', open);
      lookPanel.hidden = !open;
    };

    Object.entries(inputs).forEach(([key, node]) => {
      if (!node) return;
      node.addEventListener('input', () => {
        settings[key] = clamp(Number(node.value) || DEFAULTS[key], Number(node.min) || 0, Number(node.max) || 999);
        render();
      });
    });

    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        settings = { ...PRESETS[button.dataset.lookPreset] };
        render();
      });
    });

    resetButton?.addEventListener('click', () => {
      settings = { ...DEFAULTS };
      render();
    });

    toggle.addEventListener('click', event => {
      event.stopPropagation();
      setPanelOpen(!lookPanel.classList.contains('open'));
    });

    lookPanel.addEventListener('click', event => event.stopPropagation());
    document.addEventListener('click', () => setPanelOpen(false));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') setPanelOpen(false);
    });

    const uiToggle = document.getElementById('toggleUI');
    uiToggle?.addEventListener('click', () => setPanelOpen(false));
    document.getElementById('toggleTools')?.addEventListener('click', () => setPanelOpen(false));

    render();
    setPanelOpen(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup, { once: true });
  else setup();
})();
