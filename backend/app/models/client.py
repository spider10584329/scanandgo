"""
Client model
"""
from sqlalchemy import Column, Integer, String
from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, nullable=False, unique=True, index=True)
    clientname = Column(String(255), nullable=False)
