import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import styles from './ImageEditor.module.css';

const ASPECT_RATIOS = [
  { label: 'Original', value: 'original' },
  { label: 'Free', value: 'free' },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
];

const STEPS = [
  { label: 'Crop', value: 1 },
  { label: 'Adjust', value: 2 },
  { label: 'Filter', value: 3 },
];

const FILTERS = [
  { label: 'None', value: 'none' },
  { label: 'Chrome', value: 'chrome' },
  { label: 'Fade', value: 'fade' },
  { label: 'Mono', value: 'mono' },
  { label: 'Noir', value: 'noir' },
  { label: 'Process', value: 'process' },
  { label: 'Tonal', value: 'tonal' },
  { label: 'Transfer', value: 'transfer' }
];

const ADJUST_CONTROLS = [
  {
    id: 'brightness',
    label: 'Brightness',
    defaultValue: 100,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3V5M12 19V21M3 12H5M19 12H21M5.63 5.63L7.05 7.05M18.37 5.63L16.95 7.05M5.63 18.37L7.05 16.95M18.37 18.37L16.95 16.95" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    min: 0,
    max: 200,
    step: 1,
    unit: '%'
  },
  {
    id: 'contrast',
    label: 'Contrast',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 12C12 9.23858 14.2386 7 17 7C14.2386 7 12 9.23858 12 12C12 14.7614 14.2386 17 17 17C14.2386 17 12 14.7614 12 12Z" fill="currentColor" />
      </svg>
    ),
    min: 0,
    max: 200,
    step: 1,
    unit: '%'
  },
  {
    id: 'temperature',
    label: 'Temperature',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 9C11.4477 9 11 9.44772 11 10V16.1707C10.4022 16.5825 10 17.2422 10 18C10 19.1046 10.8954 20 12 20C13.1046 20 14 19.1046 14 18C14 17.2422 13.5978 16.5825 13 16.1707V10C13 9.44772 12.5523 9 12 9Z" fill="currentColor" />
        <path d="M12 6C11.4477 6 11 6.44772 11 7C11 7.55228 11.4477 8 12 8C12.5523 8 13 7.55228 13 7C13 6.44772 12.5523 6 12 6Z" fill="currentColor" />
      </svg>
    ),
    min: -100,
    max: 100,
    step: 1,
    unit: ''
  },
  {
    id: 'tint',
    label: 'Tint',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="currentColor" />
      </svg>
    ),
    min: -180,
    max: 180,
    step: 1,
    unit: '°'
  },
  {
    id: 'gamma',
    label: 'Gamma',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    min: 0.1,
    max: 2,
    step: 0.1,
    unit: ''
  }
];

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0) => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  canvas.width = safeArea;
  canvas.height = safeArea;

  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );

  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.putImageData(
    data,
    0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x,
    0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y
  );

  return canvas;
};

const applyAdjustments = (canvas, ctx, adjustments) => {
  const { brightness, contrast, temperature, tint, gamma } = adjustments;

  // 밝기 조정
  const brightnessValue = (brightness - 100) / 100;

  // 대비 조정
  const contrastValue = (contrast - 100) / 100;

  // 색온도 조정 (파란색-노란색)
  const tempValue = temperature / 100;

  // 색조 조정 (녹색-자주색)
  const tintValue = tint / 100;

  // 감마 조정
  const gammaValue = gamma;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    // 밝기 조정
    data[i] += 255 * brightnessValue;     // R
    data[i + 1] += 255 * brightnessValue; // G
    data[i + 2] += 255 * brightnessValue; // B

    // 대비 조정
    const factor = (259 * (contrastValue + 255)) / (255 * (259 - contrastValue));
    data[i] = factor * (data[i] - 128) + 128;     // R
    data[i + 1] = factor * (data[i + 1] - 128) + 128; // G
    data[i + 2] = factor * (data[i + 2] - 128) + 128; // B

    // 색온도 조정
    if (tempValue > 0) {
      data[i] += tempValue * 255;     // R 증가
      data[i + 2] -= tempValue * 255; // B 감소
    } else {
      data[i] -= Math.abs(tempValue) * 255;     // R 감소
      data[i + 2] += Math.abs(tempValue) * 255; // B 증가
    }

    // 색조 조정
    if (tintValue > 0) {
      data[i + 1] += tintValue * 255; // G 증가
      data[i] -= tintValue * 255;     // R 감소
    } else {
      data[i + 1] -= Math.abs(tintValue) * 255; // G 감소
      data[i] += Math.abs(tintValue) * 255;     // R 증가
    }

    // 감마 조정
    data[i] = Math.pow(data[i] / 255, gammaValue) * 255;     // R
    data[i + 1] = Math.pow(data[i + 1] / 255, gammaValue) * 255; // G
    data[i + 2] = Math.pow(data[i + 2] / 255, gammaValue) * 255; // B

    // 값 범위 제한
    data[i] = Math.max(0, Math.min(255, data[i]));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1]));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2]));
  }

  ctx.putImageData(imageData, 0, 0);
};

const ImageEditor = ({ image, onSave, onClose, onRequestUpload }) => {
  const [step, setStep] = useState(1);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [temperature, setTemperature] = useState(0);
  const [tint, setTint] = useState(0);
  const [gamma, setGamma] = useState(1);
  const [aspectRatio, setAspectRatio] = useState('original');
  const [customRatio, setCustomRatio] = useState({ width: 1, height: 1 });
  const [showCustomRatio, setShowCustomRatio] = useState(false);
  const [filter, setFilter] = useState('none');

  // 이미지 원본 비율 계산
  const [originalAspectRatio, setOriginalAspectRatio] = useState(null);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [activeAdjust, setActiveAdjust] = useState(null);
  const adjustValues = {
    brightness,
    contrast,
    temperature,
    tint,
    gamma
  };

  const setAdjustValue = (id, value) => {
    switch (id) {
      case 'brightness': setBrightness(value); break;
      case 'contrast': setContrast(value); break;
      case 'temperature': setTemperature(value); break;
      case 'tint': setTint(value); break;
      case 'gamma': setGamma(value); break;
    }
  };

  React.useEffect(() => {
    if (image) {
      const img = new Image();
      img.src = image;
      img.onload = () => {
        setOriginalAspectRatio(img.width / img.height);
      };
    }
  }, [image]);

  React.useEffect(() => {
    if (image) {
      document.documentElement.style.setProperty('--preview-image', `url(${image})`);
    }
  }, [image]);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleRotationChange = (e) => {
    const value = parseInt(e.target.value);
    setRotation(value);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleAspectRatioChange = (ratio) => {
    setAspectRatio(ratio);
    if (ratio === 'free') {
      setShowCustomRatio(true);
    } else {
      setShowCustomRatio(false);
    }
  };

  const handleCustomRatioChange = (type, value) => {
    const numValue = parseFloat(value) || 1;
    setCustomRatio(prev => ({
      ...prev,
      [type]: numValue
    }));
    setAspectRatio(customRatio.width / customRatio.height);
  };

  const getAdjustmentFilters = () => {
    const filters = [];

    // 밝기 조정 (0-200%)
    filters.push(`brightness(${brightness / 100})`);

    // 대비 조정 (0-200%)
    filters.push(`contrast(${contrast}%)`);

    // 채도 조정 (-100 ~ 100 을 0-200% 로 변환)
    filters.push(`saturate(${100 + temperature}%)`);

    // 색조 회전 (-180 ~ 180도)
    if (tint !== 0) {
      filters.push(`hue-rotate(${tint}deg)`);
    }

    // 감마는 CSS filter로 직접 구현할 수 없어서 제외

    // 프리셋 필터 적용
    if (filter !== 'none') {
      switch (filter) {
        case 'chrome':
          filters.push('sepia(0.5) saturate(1.5)');
          break;
        case 'fade':
          filters.push('opacity(0.8) saturate(0.8)');
          break;
        case 'mono':
          filters.push('grayscale(1)');
          break;
        case 'noir':
          filters.push('grayscale(1) contrast(1.5)');
          break;
        case 'process':
          filters.push('sepia(0.5) hue-rotate(30deg)');
          break;
        case 'tonal':
          filters.push('sepia(0.5) contrast(1.5)');
          break;
        case 'transfer':
          filters.push('sepia(1) hue-rotate(-50deg)');
          break;
      }
    }

    return filters.join(' ');
  };

  const handleSave = async () => {
    try {
      if (!croppedAreaPixels) {
        console.error('No cropped area pixels');
        return;
      }

      // 크롭된 이미지 생성
      const croppedCanvas = await getCroppedImg(image, croppedAreaPixels, rotation);

      // 새 캔버스 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;

      // 이미지 그리기
      ctx.filter = getAdjustmentFilters(); // CSS 필터 적용
      ctx.drawImage(croppedCanvas, 0, 0);
      ctx.filter = 'none';

      // 감마 조정
      if (gamma !== 1) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          data[i] = Math.pow(data[i] / 255, gamma) * 255;
          data[i + 1] = Math.pow(data[i + 1] / 255, gamma) * 255;
          data[i + 2] = Math.pow(data[i + 2] / 255, gamma) * 255;
        }

        ctx.putImageData(imageData, 0, 0);
      }

      // Promise로 blob 생성 처리
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, 'image/jpeg', 0.95);
      });

      if (!blob) {
        throw new Error('Failed to create blob');
      }

      const imageUrl = URL.createObjectURL(blob);

      // onSave 호출 후 onClose 실행
      await onSave({
        blob: blob,
        url: imageUrl,
        width: canvas.width,
        height: canvas.height
      });

      onClose();

    } catch (e) {
      console.error('이미지 처리 중 오류 발생:', e);
    }
  };

  const handleSliderStyle = (value, min, max) => {
    const percent = ((value - min) / (max - min)) * 100;
    return { '--value-percent': `${percent}%` };
  };

  const handleResetAdjustment = (id) => {
    const control = ADJUST_CONTROLS.find(c => c.id === id);
    if (control) {
      setAdjustValue(id, control.defaultValue);
    }
  };

  const handleRequestUpload = () => {
    if (typeof onRequestUpload === 'function') {
      onRequestUpload();
    } else {
      console.warn('onRequestUpload 함수가 전달되지 않았습니다');
      // 이미지 업로드 기능이 필요한 경우 기본 동작 제공
      // 예: 모달을 닫고 알림 표시
      alert('이미지 업로드 기능을 사용할 수 없습니다.');
      if (typeof onClose === 'function') {
        onClose();
      }
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.editor}>
        <div className={styles.topBar}>
          <button className={styles.closeButton} onClick={onClose}>Cancel</button>
          <div className={styles.steps}>
            {STEPS.map((s) => (
              <button
                key={s.value}
                className={`${styles.step} ${step === s.value ? styles.active : ''}`}
                onClick={() => setStep(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className={styles.topBarActions}>
            <button
              className={styles.uploadNewButton}
              onClick={handleRequestUpload}
            >
              Upload New
            </button>
            <button className={styles.saveButton} onClick={handleSave}>Done</button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.cropContainer}>
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspectRatio === 'original' ? originalAspectRatio :
                aspectRatio === 'free' ? null :
                  aspectRatio}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
              style={{
                containerStyle: {
                  filter: getAdjustmentFilters()
                }
              }}
            />
          </div>
        </div>

        <div className={styles.controls}>
          {step === 1 && (
            <>
              <div className={styles.ratioControls}>
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.label}
                    className={`${styles.ratioButton} ${aspectRatio === ratio.value ? styles.active : ''}`}
                    onClick={() => handleAspectRatioChange(ratio.value)}
                  >
                    {ratio.label}
                  </button>
                ))}
              </div>

              {showCustomRatio && (
                <div className={styles.customRatioInputs}>
                  <div className={styles.ratioInput}>
                    <input
                      type="number"
                      min="1"
                      value={customRatio.width}
                      onChange={(e) => handleCustomRatioChange('width', e.target.value)}
                    />
                    <span>:</span>
                    <input
                      type="number"
                      min="1"
                      value={customRatio.height}
                      onChange={(e) => handleCustomRatioChange('height', e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className={styles.editControls}>
                <div className={styles.sliderControl}>
                  <div className={styles.zoomControl}>
                    <svg viewBox="0 0 24 24" className={styles.zoomIcon}>
                      <path fill="currentColor" d="M15 3l2.3 2.3-2.89 2.87 1.42 1.42L18.7 6.7 21 9V3h-6z" />
                    </svg>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                    />
                    <svg viewBox="0 0 24 24" className={styles.zoomIcon}>
                      <path fill="currentColor" d="M9 21L6.7 18.7l2.89-2.87-1.42-1.42L5.3 17.3 3 15v6h6z" />
                    </svg>
                  </div>

                  <div className={styles.rotationControl}>
                    <span className={styles.rotationValue}>{rotation}°</span>
                    <div className={styles.rotationSlider}>
                      <input
                        type="range"
                        min={-45}
                        max={45}
                        value={rotation}
                        onChange={(e) => setRotation(parseInt(e.target.value))}
                        className={styles.rotationInput}
                      />
                      <div className={styles.rotationTicks}>
                        {Array.from({ length: 91 }, (_, i) => i - 45).map((tick) => (
                          <div
                            key={tick}
                            className={`${styles.rotationTick} ${tick === 0 ? styles.centerTick : ''
                              } ${Math.abs(tick) % 5 === 0 ? styles.majorTick : ''}`}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      className={styles.resetButton}
                      onClick={() => setRotation(0)}
                    >
                      <svg viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <div className={styles.adjustControls}>
              <div className={styles.adjustButtons}>
                {ADJUST_CONTROLS.map((control) => (
                  <button
                    key={control.id}
                    className={`${styles.adjustButton} ${activeAdjust === control.id ? styles.active : ''}`}
                    onClick={() => setActiveAdjust(control.id)}
                  >
                    {control.icon}
                    <span>{control.label}</span>
                    <div className={styles.adjustValue}>
                      {adjustValues[control.id]}{control.unit}
                      <button
                        className={styles.resetAdjustButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetAdjustment(control.id);
                        }}
                        title="Reset to default"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                        </svg>
                      </button>
                    </div>
                  </button>
                ))}
              </div>
              {activeAdjust && (
                <div className={styles.activeSlider}>
                  <div className={styles.sliderHeader}>
                    <div className={styles.sliderLabel}>
                      {ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.icon}
                      {ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.label}
                    </div>
                    <div className={styles.sliderValue}>
                      {adjustValues[activeAdjust]}
                      {ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.unit}
                    </div>
                  </div>
                  <div className={styles.sliderContainer}>
                    <input
                      type="range"
                      min={ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.min}
                      max={ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.max}
                      step={ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.step}
                      value={adjustValues[activeAdjust]}
                      onChange={(e) => setAdjustValue(activeAdjust,
                        ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.step === 0.1
                          ? parseFloat(e.target.value)
                          : parseInt(e.target.value)
                      )}
                      className={styles.slider}
                      style={handleSliderStyle(
                        adjustValues[activeAdjust],
                        ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.min,
                        ADJUST_CONTROLS.find(c => c.id === activeAdjust)?.max
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className={styles.filterControls}>
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  className={`${styles.filterButton} ${filter === f.value ? styles.active : ''}`}
                  onClick={() => setFilter(f.value)}
                >
                  <div
                    className={`${styles.filterPreview} ${f.value !== 'none' ? styles[f.value] : ''}`}
                  />
                  <span>{f.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ImageEditor; 