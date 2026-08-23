.PHONY: demo up down test seed logs

# Fresh clone to working system in one command.
demo: up seed
	@echo "Backend:  http://localhost:8000/health"
	@echo "Frontend: http://localhost:5173"
	@echo "Try:      curl -X POST http://localhost:8000/piles?name=demo&domain=vendor_contracts"

up:
	docker compose up --build -d

down:
	docker compose down -v

seed:
	docker compose exec backend python -m seed.seed_data

test:
	docker compose exec backend pytest -v

logs:
	docker compose logs -f backend
