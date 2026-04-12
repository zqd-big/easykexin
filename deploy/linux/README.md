# Linux 部署说明

## 方式一：裸机运行
适合 Linux 机器已经有 `python3 + gcc + gdb` 的场景。

```bash
cd easykexin-main
bash run-linux.sh --lan
```

访问：

```text
http://<linux-server-ip>:19081/index.html?editor2
```

## 方式二：Docker 部署
适合不想在宿主机装 Python/gcc/gdb，但机器已有 Docker 的场景。

```bash
cd easykexin-main
cd deploy/linux
docker compose up -d --build
```

访问：

```text
http://<linux-server-ip>:19081/index.html?editor2
```

停止：

```bash
docker compose down
```

## 安全边界
这个服务提供一键判题和真单步调试，本质上会编译并运行用户提交的 C 代码。只建议部署在可信内网，不要直接暴露公网。
