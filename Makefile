# Africa Railways Project Management

.PHONY: install start-web deploy-web compile-token deploy-token-local node clean-cache

install:
	npm install --prefix SmartphoneApp

start-web:
	npx expo start --project SmartphoneApp --web

deploy-web:
	cd SmartphoneApp && npx expo export --platform web
	cd SmartphoneApp && eas deploy

# --- Blockchain (AFRC) ---
# Use the local binary to avoid HHE22
node:
	./node_modules/.bin/hardhat node

compile-token:
	./node_modules/.bin/hardhat compile

deploy-token-local:
	./node_modules/.bin/hardhat run blockchain/scripts/deploy.js --network localhost

# --- Infrastructure ---
deploy-infra:
	./deploy_lambda.sh
	./set_trigger.sh

sync-data:
	./upload_data.sh

clean-cache:
	cd SmartphoneApp && npx expo start -c
	rm -rf SmartphoneApp/.expo

# Check balance of Account #0
check-balance:
	npx hardhat run blockchain/scripts/mint_reward.js --network localhost | grep "Traveler Balance"
