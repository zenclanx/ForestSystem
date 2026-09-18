# 森林灾害防控与公众服务系统

基于 Vue3 + Express + YOLOv8 的森林灾害防控系统，实现病虫害图像识别、树种三维模型展示与三类角色的权限管理。

## 系统截图
<img width="1134" height="693" alt="屏幕截图 2026-04-14 032338" src="https://github.com/user-attachments/assets/f70f4198-60f7-4e8d-8d1e-30d52ff5fb16" />
<img width="1295" height="837" alt="屏幕截图 2026-04-14 215030" src="https://github.com/user-attachments/assets/a2c192ef-072c-4e28-b79c-f1225d3bcfc0" />
<img width="959" height="787" alt="屏幕截图 2026-04-14 214504" src="https://github.com/user-attachments/assets/d6a29b93-429f-4063-a9ef-66f29cbf852c" />
<img width="960" height="1001" alt="屏幕截图 2026-04-14 165319" src="https://github.com/user-attachments/assets/632dc02d-a296-4b0c-9b29-4f29780ba7fb" />
<img width="1086" height="841" alt="屏幕截图 2026-04-14 164507" src="https://github.com/user-attachments/assets/e001e0c4-57b9-474a-ad81-b7b5ebc38b58" />
<img width="1253" height="813" alt="屏幕截图 2026-04-14 164538" src="https://github.com/user-attachments/assets/5927ad64-2141-4d30-af75-cdb637c7d1b5" />

## 系统结构
<img width="3510" height="3363" alt="用例图" src="https://github.com/user-attachments/assets/67ea93be-70b1-4115-b31f-a36e966fea49" />
<img width="3270" height="4020" alt="用例图（2）" src="https://github.com/user-attachments/assets/80c4e759-33e0-4b18-9f74-9f7df34eb63c" />
<img width="3873" height="2223" alt="用户登录流程泳道图" src="https://github.com/user-attachments/assets/957f0b14-8058-450a-ad31-baab6aac943d" />
<img width="2313" height="2613" alt="问卷创建流程图（拆分2）" src="https://github.com/user-attachments/assets/4cb15c3b-7fb7-4d5a-86f9-f8d8957ab1a4" />
<img width="3627" height="3273" alt="问卷参与与积分使用流程图" src="https://github.com/user-attachments/assets/0fa0068e-947f-49c2-9999-ed668e757881" />
<img width="1485" height="2493" alt="问卷参与流程图（拆分1）" src="https://github.com/user-attachments/assets/5f90f7df-90c2-49bc-8620-1b32b7a461ed" />
<img width="1521" height="2496" alt="维护树种信息流程图" src="https://github.com/user-attachments/assets/62bf1762-e2b1-4e60-8a24-014fe4ff8b5c" />
<img width="1602" height="2013" alt="提交留言流程图（拆分1）" src="https://github.com/user-attachments/assets/1b4da386-18c6-490c-a3aa-416b10081673" />
<img width="2808" height="3618" alt="三维模型加载流程图" src="https://github.com/user-attachments/assets/b17c0f88-2589-4772-8c7a-6289e0a01b72" />
<img width="2661" height="1083" alt="模块设计" src="https://github.com/user-attachments/assets/1fb11b2c-04a8-4f92-b1d1-94cbe6ad949e" />


## 功能特性

- **病虫害图像识别**：上传图片 → YOLOv8 模型推理 → 识别结果落库 → 前端可视化展示
- **树种三维模型展示**：基于 Three.js（WebGL）加载树种 glTF 模型，支持旋转、缩放与信息查看
- **角色权限控制**：管理员 / 巡检员 / 公众三类角色，JWT 登录鉴权 + 按角色划分功能
- **环境监测数据管理**：环境监测数据的录入、查询与可视化

## 技术栈

| 层次 | 技术 |
|---|---|
| 前端 | Vue3、Vue Router、Three.js（WebGL）、Axios |
| 后端 | Node.js + Express、JWT |
| AI | Python、YOLOv8、Roboflow 公开病虫害数据集 |
| 数据库 | MySQL |
| 部署 | 阿里云 ECS、Linux |

## 快速开始

```bash
# 1. 前端
npm install
npm run dev        【如果你的启动命令是 serve 就改掉】

# 2. 后端接口服务（server 目录）
cd server
npm install
node app.js        【按你的实际入口文件改】

# 3. 识别服务（backend 目录，需 Python 3.x）
cd backend
pip install flask ultralytics   【按你实际依赖改】
python app.py
```

## 说明

- 三维模型 `.glb` 文件与训练权重 `.pt` 体积较大，未纳入仓库：模型放 `public/3dModel/` 目录即可正常运行
- 训练数据来自 Roboflow 公开病虫害数据集，训练代码与配置见 `backend/`
