package balance

import (
	"context"
	"fmt"
	"math/big"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/ethclient"
)

// Monitor handles balance monitoring and alerts
type Monitor struct {
	client         *ethclient.Client
	address        common.Address
	minBalance     *big.Float
	checkInterval  time.Duration
	alertCallback  func(balance *big.Float)
}

// NewMonitor creates a new balance monitor
func NewMonitor(client *ethclient.Client, address common.Address, minBalance float64) *Monitor {
	return &Monitor{
		client:        client,
		address:       address,
		minBalance:    big.NewFloat(minBalance),
		checkInterval: 5 * time.Minute,
	}
}

// GetBalance fetches the current balance in POL
func (m *Monitor) GetBalance() (*big.Float, error) {
	balance, err := m.client.BalanceAt(context.Background(), m.address, nil)
	if err != nil {
		return nil, err
	}
	// Convert from Wei to POL (18 decimals)
	fbalance := new(big.Float).SetInt(balance)
	return new(big.Float).Quo(fbalance, big.NewFloat(1e18)), nil
}

// GetBalanceWei fetches the current balance in Wei
func (m *Monitor) GetBalanceWei() (*big.Int, error) {
	return m.client.BalanceAt(context.Background(), m.address, nil)
}

// CheckBalance checks if balance is above minimum threshold
func (m *Monitor) CheckBalance() (bool, *big.Float, error) {
	balance, err := m.GetBalance()
	if err != nil {
		return false, nil, err
	}
	
	isSufficient := balance.Cmp(m.minBalance) >= 0
	return isSufficient, balance, nil
}

// EstimateTransactions estimates how many transactions can be performed
func (m *Monitor) EstimateTransactions(avgGasCostPOL float64) (int, error) {
	balance, err := m.GetBalance()
	if err != nil {
		return 0, err
	}
	
	avgCost := big.NewFloat(avgGasCostPOL)
	txCount := new(big.Float).Quo(balance, avgCost)
	count, _ := txCount.Int64()
	
	return int(count), nil
}

// GetGasPrice fetches current network gas price
func (m *Monitor) GetGasPrice() (*big.Int, error) {
	return m.client.SuggestGasPrice(context.Background())
}

// EstimateMintCost estimates the cost of a single mint transaction
func (m *Monitor) EstimateMintCost(gasLimit uint64) (*big.Float, error) {
	gasPrice, err := m.GetGasPrice()
	if err != nil {
		return nil, err
	}
	
	cost := new(big.Int).Mul(gasPrice, big.NewInt(int64(gasLimit)))
	costPOL := new(big.Float).Quo(
		new(big.Float).SetInt(cost),
		big.NewFloat(1e18),
	)
	
	return costPOL, nil
}

// StartMonitoring starts continuous balance monitoring
func (m *Monitor) StartMonitoring(stopChan <-chan bool) {
	ticker := time.NewTicker(m.checkInterval)
	defer ticker.Stop()
	
	for {
		select {
		case <-stopChan:
			return
		case <-ticker.C:
			sufficient, balance, err := m.CheckBalance()
			if err != nil {
				fmt.Printf("Error checking balance: %v\n", err)
				continue
			}
			
			if !sufficient && m.alertCallback != nil {
				m.alertCallback(balance)
			}
		}
	}
}

// SetAlertCallback sets the callback function for low balance alerts
func (m *Monitor) SetAlertCallback(callback func(balance *big.Float)) {
	m.alertCallback = callback
}

// SetCheckInterval sets the interval for balance checks
func (m *Monitor) SetCheckInterval(interval time.Duration) {
	m.checkInterval = interval
}

// FormatBalance formats a balance for display
func FormatBalance(balance *big.Float, decimals int) string {
	return balance.Text('f', decimals)
}

// WeiToPOL converts Wei to POL
func WeiToPOL(wei *big.Int) *big.Float {
	fbalance := new(big.Float).SetInt(wei)
	return new(big.Float).Quo(fbalance, big.NewFloat(1e18))
}

// POLToWei converts POL to Wei
func POLToWei(pol *big.Float) *big.Int {
	wei := new(big.Float).Mul(pol, big.NewFloat(1e18))
	result, _ := wei.Int(nil)
	return result
}

// GweiToPOL converts Gwei to POL
func GweiToPOL(gwei *big.Int) *big.Float {
	fgwei := new(big.Float).SetInt(gwei)
	return new(big.Float).Quo(fgwei, big.NewFloat(1e9))
}
