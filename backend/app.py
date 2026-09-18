from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from ultralytics import YOLO
import os
from io import BytesIO
from PIL import Image
import cv2
import base64
import uuid
from werkzeug.utils import secure_filename

# Flask 初始化
app = Flask(__name__)
CORS(app)

# 加载模型
model = YOLO("runs/detect/train8/weights/best.pt")

# 英文类别映射
class_map = {
    'Centipedes': '蜈蚣',
    'Cockroaches': '蟑螂',
    'House-centipedes': '家蜈蚣',
    'Larvas': '幼虫',
    'Moth-flies': '蛾蝇',
    'Stink-Bugs': '臭虫',
    'House-moths': '家蛀蛾',
    'spiders': '蜘蛛'
}

# 防治方案字典
treatment_map = {
    "蜈蚣": "使用杀虫剂并清理杂物",
    "蟑螂": "保持清洁，使用蟑螂诱杀剂",
    "家蜈蚣": "保持干燥，封堵缝隙",
    "幼虫": "定期检查植物并喷洒安全杀虫剂",
    "蛾蝇": "使用诱捕灯和杀虫剂",
    "臭虫": "清洗衣物，高温处理",
    "家蛀蛾": "清理谷物，使用防蛀剂",
    "蜘蛛": "清理角落，保持通风"
}

# 上传目录
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


def save_uploaded_file(img_file):
    """保存上传文件，使用唯一文件名避免覆盖"""
    original_name = secure_filename(img_file.filename or "image")
    ext = os.path.splitext(original_name)[1] or ".jpg"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    save_path = os.path.join(UPLOAD_DIR, unique_name)
    img_file.save(save_path)
    return save_path, original_name


def run_inference(save_path):
    """执行 YOLO 推理并统一中文类别"""
    results = model(save_path)
    results[0].names = {i: class_map.get(name, name) for i, name in results[0].names.items()}
    return results


def build_predictions(result):
    """构建预测结果 JSON"""
    predictions = []

    if result.boxes is None or len(result.boxes) == 0:
        return predictions

    boxes_xyxy = result.boxes.xyxy.tolist()
    cls_ids = result.boxes.cls.tolist()
    confs = result.boxes.conf.tolist() if result.boxes.conf is not None else []

    for idx, cls_id in enumerate(cls_ids):
        pest = result.names[int(cls_id)]
        bbox = boxes_xyxy[idx]
        confidence = round(float(confs[idx]), 4) if idx < len(confs) else None

        predictions.append({
            "class": pest,
            "bbox": bbox,
            "confidence": confidence,
            "treatment": treatment_map.get(pest, "暂无防治方案")
        })

    return predictions


def build_annotated_image_base64(result):
    """生成标注图 base64"""
    annotated_img = result.plot()
    annotated_img = cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(annotated_img)

    buf = BytesIO()
    pil_img.save(buf, format="PNG")
    buf.seek(0)
    img_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")
    return img_base64


def build_annotated_image_buffer(result):
    """生成 send_file 可直接返回的标注图"""
    annotated_img = result.plot()
    annotated_img = cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB)
    pil_img = Image.fromarray(annotated_img)

    buf = BytesIO()
    pil_img.save(buf, format="PNG")
    buf.seek(0)
    return buf


# 单图检测返回标注图片
@app.route("/predict", methods=["POST"])
def predict():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        img_file = request.files["image"]
        if not img_file or img_file.filename == "":
            return jsonify({"error": "Empty file"}), 400

        save_path, _ = save_uploaded_file(img_file)
        results = run_inference(save_path)
        buf = build_annotated_image_buffer(results[0])

        return send_file(buf, mimetype="image/png")

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 单图检测返回 JSON
@app.route("/predict-json", methods=["POST"])
def predict_json():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        img_file = request.files["image"]
        if not img_file or img_file.filename == "":
            return jsonify({"error": "Empty file"}), 400

        save_path, _ = save_uploaded_file(img_file)
        results = run_inference(save_path)
        predictions = build_predictions(results[0])

        return jsonify({"predictions": predictions})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 单图检测：一次请求同时返回 JSON + 标注图
@app.route("/predict-all", methods=["POST"])
def predict_all():
    try:
        if "image" not in request.files:
            return jsonify({"error": "No image uploaded"}), 400

        img_file = request.files["image"]
        if not img_file or img_file.filename == "":
            return jsonify({"error": "Empty file"}), 400

        save_path, original_name = save_uploaded_file(img_file)
        results = run_inference(save_path)

        predictions = build_predictions(results[0])
        result_base64 = build_annotated_image_base64(results[0])

        return jsonify({
            "filename": original_name,
            "predictions": predictions,
            "resultBase64": result_base64
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 批量检测返回图片 JSON
@app.route("/predict-batch", methods=["POST"])
def predict_batch():
    try:
        if "images" not in request.files:
            return jsonify({"error": "No images uploaded"}), 400

        files = request.files.getlist("images")
        if not files:
            return jsonify({"error": "Empty file list"}), 400

        results_list = []

        for img_file in files:
            if not img_file or img_file.filename == "":
                continue

            save_path, original_name = save_uploaded_file(img_file)
            results = run_inference(save_path)

            predictions = build_predictions(results[0])
            img_base64 = build_annotated_image_base64(results[0])

            results_list.append({
                "filename": original_name,
                "predictions": predictions,
                "resultBase64": img_base64
            })

        return jsonify({"results": results_list})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# 启动服务
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)