FROM python:3.11-slim

WORKDIR /app

ENV PYTHONPATH=/app

RUN pip install uv

COPY backend/pyproject.toml backend/uv.lock* ./
RUN uv sync --frozen --no-dev

COPY backend/src ./src
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini

RUN mkdir -p /app/uploads

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
