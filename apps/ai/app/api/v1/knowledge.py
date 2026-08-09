from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.rag import hybrid_search, ingest_document
from app.api.deps import get_current_user
from app.db.session import get_db
from app.models import AuditLog, Document, User
from app.schemas import DocumentIn, DocumentOut, SearchIn

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[DocumentOut]:
    docs = db.scalars(
        select(Document).where(Document.org_id == user.org_id).order_by(Document.created_at.desc())
    ).all()
    return [
        DocumentOut(
            id=d.id,
            title=d.title,
            doc_type=d.doc_type,
            source=d.source,
            created_at=d.created_at,
            preview=d.content[:240],
        )
        for d in docs
    ]


@router.post("/documents", response_model=DocumentOut)
def create_document(
    body: DocumentIn,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentOut:
    doc = Document(
        org_id=user.org_id,
        title=body.title,
        content=body.content,
        doc_type=body.doc_type,
        source=body.source,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    ingest_document(db, doc)
    db.add(AuditLog(org_id=user.org_id, user_id=user.id, action="ingest_document", resource=doc.id))
    db.commit()
    return DocumentOut(
        id=doc.id,
        title=doc.title,
        doc_type=doc.doc_type,
        source=doc.source,
        created_at=doc.created_at,
        preview=doc.content[:240],
    )


@router.get("/documents/{doc_id}")
def get_document(doc_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    doc = db.get(Document, doc_id)
    if not doc or doc.org_id != user.org_id:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "title": doc.title,
        "doc_type": doc.doc_type,
        "source": doc.source,
        "content": doc.content,
        "meta": doc.meta,
        "created_at": doc.created_at,
        "chunk_count": len(doc.chunks),
    }


@router.post("/search")
def search(body: SearchIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    hits = hybrid_search(db, user.org_id, body.query, limit=body.limit)
    return {"query": body.query, "results": hits}
