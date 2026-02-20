"""
User and Role models
"""
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Role(Base):
    """Role model"""
    __tablename__ = "role"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(120), unique=True, nullable=False)

    # Relationships
    users = relationship("User", back_populates="role_ref")


class User(Base):
    """User model"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(120), unique=True, nullable=False)
    password = Column(String(120), nullable=False)
    role = Column(Integer, ForeignKey("role.id"))

    # Relationships
    role_ref = relationship("Role", back_populates="users")
