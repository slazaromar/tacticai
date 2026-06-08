VENV   = .venv
PIP    = $(VENV)/bin/pip
PYTEST = $(VENV)/bin/pytest

$(VENV)/bin/activate: requirements-test.txt
	python3 -m venv $(VENV)
	$(PIP) install --upgrade pip -q
	$(PIP) install -r requirements-test.txt -q

test: $(VENV)/bin/activate
	$(PYTEST)

test-v: $(VENV)/bin/activate
	$(PYTEST) -v

test-cov: $(VENV)/bin/activate
	$(PYTEST) --tb=short --cov=app --cov-report=term-missing

.PHONY: test test-v test-cov
