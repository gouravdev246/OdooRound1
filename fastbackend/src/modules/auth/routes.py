from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from src.db import get_db
from src.modules.auth import service
from src.modules.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponse,
    UserResponse,
    VerifyOTPRequest,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=SignupResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    user = service.signup(db, request)
    return {"message": "User created successfully", "user": user}


@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    token, user = service.login(db, request)
    return {"access_token": token, "token_type": "bearer", "user": UserResponse.model_validate(user)}


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service.forgot_password(db, request)
    return {"message": "OTP generated successfully"}


@router.post("/verify-otp", response_model=MessageResponse)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    service.verify_otp(db, request)
    return {"message": "OTP verified successfully"}


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    service.reset_password(db, request)
    return {"message": "Password reset successfully"}