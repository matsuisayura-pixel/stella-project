"""
RAGシステム
ChromaDB + sentence-transformers を使用したナレッジベース検索
"""

import os
import glob
from pathlib import Path
from typing import List, Dict

import chromadb
from chromadb.utils import embedding_functions


KNOWLEDGE_BASE_DIR = Path(__file__).parent.parent / "knowledge_base"
CHROMA_DB_DIR = Path(__file__).parent.parent / ".chromadb"


def get_embedding_function():
    """埋め込み関数を返す（ローカルモデル使用・APIコスト不要）"""
    return embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="paraphrase-multilingual-MiniLM-L12-v2"
    )


def get_collection():
    """ChromaDBコレクションを取得（なければ作成）"""
    client = chromadb.PersistentClient(path=str(CHROMA_DB_DIR))
    ef = get_embedding_function()
    collection = client.get_or_create_collection(
        name="stella_knowledge",
        embedding_function=ef,
        metadata={"hnsw:space": "cosine"}
    )
    return collection


def load_knowledge_base():
    """
    knowledge_base/ 以下の全.md/.txtファイルを読み込み、
    ChromaDBに登録する
    """
    collection = get_collection()

    md_files = glob.glob(str(KNOWLEDGE_BASE_DIR / "**/*.md"), recursive=True)
    txt_files = glob.glob(str(KNOWLEDGE_BASE_DIR / "**/*.txt"), recursive=True)
    all_files = md_files + txt_files

    if not all_files:
        print("⚠️  ナレッジベースにファイルが見つかりませんでした。")
        print(f"   {KNOWLEDGE_BASE_DIR} 以下に .md または .txt ファイルを追加してください。")
        return 0

    documents = []
    metadatas = []
    ids = []

    for file_path in all_files:
        path = Path(file_path)
        # テーマ名 = 親フォルダ名
        theme = path.parent.name
        doc_id = path.stem

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()

        if not content:
            continue

        # 長いドキュメントはチャンク分割（500文字単位）
        chunks = _split_text(content, chunk_size=500)
        for i, chunk in enumerate(chunks):
            chunk_id = f"{doc_id}_chunk{i}"
            # 重複チェック
            existing = collection.get(ids=[chunk_id])
            if existing["ids"]:
                continue

            documents.append(chunk)
            metadatas.append({"theme": theme, "source": path.name, "file_path": file_path})
            ids.append(chunk_id)

    if documents:
        collection.add(documents=documents, metadatas=metadatas, ids=ids)
        print(f"✅  {len(documents)} チャンクをナレッジベースに登録しました。")
    else:
        print("ℹ️  ナレッジベースはすでに最新の状態です。")

    return len(documents)


def search(query: str, n_results: int = 5, theme: str = None) -> List[Dict]:
    """
    クエリに最も関連する引用句を検索する

    Args:
        query: 検索クエリ（ユーザーの悩みや相談内容）
        n_results: 取得件数
        theme: テーマでフィルタリング（例: "金運"）

    Returns:
        List of {"text": ..., "theme": ..., "source": ...}
    """
    collection = get_collection()

    if collection.count() == 0:
        print("⚠️  ナレッジベースが空です。先に load_knowledge_base() を実行してください。")
        return []

    where = {"theme": theme} if theme else None

    results = collection.query(
        query_texts=[query],
        n_results=min(n_results, collection.count()),
        where=where
    )

    hits = []
    for i, doc in enumerate(results["documents"][0]):
        meta = results["metadatas"][0][i]
        hits.append({
            "text": doc,
            "theme": meta.get("theme", "不明"),
            "source": meta.get("source", "不明"),
            "distance": results["distances"][0][i]
        })

    return hits


def format_for_prompt(hits: List[Dict]) -> str:
    """
    検索結果をRAGプロンプト用のテキストに整形する
    """
    if not hits:
        return "（関連するアーカイブデータは見つかりませんでした）"

    lines = ["## ナレッジベースからの関連アーカイブ（RAG検索結果）\n"]
    for i, hit in enumerate(hits, 1):
        lines.append(f"### 引用 {i}（テーマ: {hit['theme']} / 出典: {hit['source']}）")
        lines.append(hit["text"])
        lines.append("")

    lines.append("---")
    lines.append("※ 上記の引用はそのまま出力せず、必ずステラの口調に変換し、現代的な文脈で統合してください。")

    return "\n".join(lines)


def _split_text(text: str, chunk_size: int = 500) -> List[str]:
    """テキストを指定文字数でチャンク分割する"""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        # 文末で切る（。や\nを優先）
        if end < len(text):
            for sep in ["。\n", "。", "\n\n", "\n"]:
                pos = text.rfind(sep, start, end)
                if pos != -1:
                    end = pos + len(sep)
                    break
        chunks.append(text[start:end].strip())
        start = end
    return [c for c in chunks if c]
