# I-005 — Satellite Imagery Foundation Models (March 2026)

## Recommended Model Stack (Priority Order)

| # | Model | HuggingFace | Task | GPU Req |
|---|-------|-------------|------|---------|
| 1 | **Prithvi-EO-2.0-300M** | `ibm-nasa-geospatial/Prithvi-EO-2.0-300M` | Change detection, land use, multi-temporal | 8GB+ |
| 2 | **YOLOv8x-OBB** | `ultralytics` | Vehicle, aircraft, ship, building detection | 8GB |
| 3 | **SAM-Geo** | `segment-geospatial` pip | Interactive segmentation | 8GB |
| 4 | **SatCLIP** | `microsoft/SatCLIP` | Location-aware encoding | 4GB |
| 5 | **YOLOv8n → ONNX** | Export from ultralytics | Browser-side detection | WebGPU |

## Key Datasets for Geopolitical Monitoring

- **xView**: 1M+ military/civilian objects at 0.3m (best for our use case)
- **DOTA v2.0**: Ships, vehicles, planes — oriented bounding boxes
- **LEVIR-CD / S2Looking**: Building change detection pairs
- **BigEarthNet**: 590K Sentinel-2 patches, 19 classes (benchmark)
- **fMoW**: 1M+ functional land use with temporal sequences

## API Services (Free Tier)

- **Sentinel Hub**: 30K requests/mo free — best Sentinel-2 API
- **Copernicus Data Space**: All EU Copernicus data free
- **Microsoft Planetary Computer**: Free STAC API + Dask hub
- **Google Earth Engine**: Free for research

## Practical Constraints

- Full Sentinel-2 tile (10980x10980): ~2400 patches at 224x224
- YOLOv8: ~15-30ms per 640x640 chip on RTX 3070
- Prithvi-600M: needs 12GB VRAM (RTX 4070)
- Browser inference: YOLOv8n via ONNX Runtime Web + WebGPU (~50-200ms per chip)

## Recommended Architecture

```
Next.js Frontend → ONNX Runtime Web (interactive chip inference)
Python Backend → TerraTorch (Prithvi) + Ultralytics (YOLO) + SAM-Geo
Data → Sentinel Hub API + PostGIS + COG storage
```

## Python Setup (when ready)

```bash
pip install terratorch ultralytics segment-geospatial
pip install rasterio pyproj sentinelhub planetary-computer pystac-client
```
