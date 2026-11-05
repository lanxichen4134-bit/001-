from pathlib import Path
import hashlib

folder = Path(__file__).resolve().parent
brain = folder.parents[2]
masters = sorted((brain / "Content/视频档案/2026").glob("C20261105-*.md"))
assert len(masters) == 20
parts = ["# 20篇连续试读版", "", "此为单篇主文件的生成阅读副本。版本为V01，状态drafting。所有修改回到单篇，再运行本脚本。实际用时待试读。", ""]
for master in masters:
    text = master.read_text()
    title = text.split("\n# ", 1)[1].split("\n", 1)[0]
    body = text.split("## 完整口播正文\n\n", 1)[1].split("\n## 两个备选开头", 1)[0]
    digest = hashlib.sha256(master.read_bytes()).hexdigest()
    parts.extend(["## " + title, "", "[单篇与编辑备注](../../视频档案/2026/" + master.name + ")", "", "来源SHA256 " + digest, "", body, ""])
(folder / "01_20篇连续试读版.md").write_text("\n".join(parts).rstrip() + "\n")
