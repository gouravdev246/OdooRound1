import secrets
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.core.security import (
    create_access_token,
    hash_password,
    password_hash,
    verify_password,
)
from src.modules.auth.models import User, UserRole
from src.modules.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    SignupRequest,
    VerifyOTPRequest,
)


def _find_user(db: Session, email: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


def _verify_reset_otp(user: User, otp: str) -> None:
    if not user.resetOtp or not user.resetOtpExpiresAt:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP is invalid")
    if user.resetOtpExpiresAt < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
    if not password_hash.verify(otp, user.resetOtp):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP is invalid")


def signup(db: Session, request: SignupRequest) -> User:
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        name=request.name,
        email=request.email,
        passwordHash=hash_password(request.password),
        role=UserRole.WAREHOUSE_STAFF,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email is already registered"
        ) from exc
    db.refresh(user)
    return user


def login(db: Session, request: LoginRequest) -> tuple[str, User]:
    user = db.query(User).filter(User.email == request.email).first()
    if user is None or not verify_password(request.password, user.passwordHash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.isActive:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive")
    return create_access_token(user.id), user


def forgot_password(db: Session, request: ForgotPasswordRequest) -> None:
    user = _find_user(db, request.email)
    otp = f"{secrets.randbelow(1_000_000):06d}"
    user.resetOtp = hash_password(otp)
    user.resetOtpExpiresAt = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    print(f"Password reset OTP for {user.email}: {otp}")


def verify_otp(db: Session, request: VerifyOTPRequest) -> None:
    _verify_reset_otp(_find_user(db, request.email), request.otp)


def reset_password(db: Session, request: ResetPasswordRequest) -> None:
    user = _find_user(db, request.email)
    _verify_reset_otp(user, request.otp)
    user.passwordHash = hash_password(request.new_password)
    user.resetOtp = None
    user.resetOtpExpiresAt = None
    db.commit()