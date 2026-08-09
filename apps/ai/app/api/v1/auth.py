from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import AuditLog, Organization, User
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> TokenOut:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    db.add(AuditLog(org_id=user.org_id, user_id=user.id, action="login", resource="auth"))
    db.commit()
    token = create_access_token(user.id, {"role": user.role, "org_id": user.org_id})
    return TokenOut(access_token=token)


@router.post("/register", response_model=TokenOut)
def register(body: RegisterIn, db: Session = Depends(get_db)) -> TokenOut:
    existing = db.scalar(select(User).where(User.email == body.email.lower()))
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    slug = body.org_name.lower().replace(" ", "-")[:80] + "-" + body.email.split("@")[0]
    org = Organization(name=body.org_name, slug=slug, plan="professional")
    db.add(org)
    db.flush()
    user = User(
        org_id=org.id,
        email=body.email.lower(),
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
        role="admin",
    )
    db.add(user)
    db.add(AuditLog(org_id=org.id, user_id=None, action="register", resource="auth", details={"email": body.email}))
    db.commit()
    token = create_access_token(user.id, {"role": user.role, "org_id": user.org_id})
    return TokenOut(access_token=token)


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> UserOut:
    org = db.get(Organization, user.org_id)
    return UserOut(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        org_id=user.org_id,
        org_name=org.name if org else None,
    )
