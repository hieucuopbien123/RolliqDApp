import { _getContracts, _requireAddress } from "./EthersRolliqConnection";

const debouncingDelayMs = 50;

const debounce = (listener) => {
  let timeoutId = undefined;
  let latestBlock = 0;

  return (...args) => {
    const event = args[args.length - 1];

    if (event.blockNumber !== undefined && event.blockNumber > latestBlock) {
      latestBlock = event.blockNumber;
    }

    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      listener(latestBlock);
      timeoutId = undefined;
    }, debouncingDelayMs);
  };
};

/** @alpha */
export class ObservableEthersRolliq {
  constructor(readable) {
    this._readable = readable;
  }

  watchTotalRedistributed(onTotalRedistributedChanged) {
    const { activePool, defaultPool } = _getContracts(
      this._readable.connection
    );
    const etherSent = activePool.filters.EtherSent();

    const redistributionListener = debounce((blockTag) => {
      this._readable
        .getTotalRedistributed({ blockTag })
        .then(onTotalRedistributedChanged);
    });

    const etherSentListener = (toAddress, _amount, event) => {
      if (toAddress === defaultPool.address) {
        redistributionListener(event);
      }
    };

    activePool.on(etherSent, etherSentListener);

    return () => {
      activePool.removeListener(etherSent, etherSentListener);
    };
  }

  watchTroveWithoutRewards(onTroveChanged, address) {
    address ??= _requireAddress(this._readable.connection);

    const { troveManager, borrowerOperations } = _getContracts(
      this._readable.connection
    );
    const troveUpdatedByTroveManager =
      troveManager.filters.TroveUpdated(address);
    const troveUpdatedByBorrowerOperations =
      borrowerOperations.filters.TroveUpdated(address);

    const troveListener = debounce((blockTag) => {
      this._readable
        .getTroveBeforeRedistribution(address, { blockTag })
        .then(onTroveChanged);
    });

    troveManager.on(troveUpdatedByTroveManager, troveListener);
    borrowerOperations.on(troveUpdatedByBorrowerOperations, troveListener);

    return () => {
      troveManager.removeListener(troveUpdatedByTroveManager, troveListener);
      borrowerOperations.removeListener(
        troveUpdatedByBorrowerOperations,
        troveListener
      );
    };
  }

  watchNumberOfTroves(onNumberOfTrovesChanged) {
    const { troveManager } = _getContracts(this._readable.connection);
    const { TroveUpdated } = troveManager.filters;
    const troveUpdated = TroveUpdated();

    const troveUpdatedListener = debounce((blockTag) => {
      this._readable
        .getNumberOfTroves({ blockTag })
        .then(onNumberOfTrovesChanged);
    });

    troveManager.on(troveUpdated, troveUpdatedListener);

    return () => {
      troveManager.removeListener(troveUpdated, troveUpdatedListener);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  watchPrice(onPriceChanged) {
    // TODO revisit
    // We no longer have our own PriceUpdated events. If we want to implement this in an event-based
    // manner, we'll need to listen to aggregator events directly. Or we could do polling.
    throw new Error("Method not implemented.");
  }

  watchTotal(onTotalChanged) {
    const { troveManager } = _getContracts(this._readable.connection);
    const { TroveUpdated } = troveManager.filters;
    const troveUpdated = TroveUpdated();

    const totalListener = debounce((blockTag) => {
      this._readable.getTotal({ blockTag }).then(onTotalChanged);
    });

    troveManager.on(troveUpdated, totalListener);

    return () => {
      troveManager.removeListener(troveUpdated, totalListener);
    };
  }

  watchStabilityDeposit(onStabilityDepositChanged, address) {
    address ??= _requireAddress(this._readable.connection);

    const { activePool, stabilityPool } = _getContracts(
      this._readable.connection
    );
    const { UserDepositChanged } = stabilityPool.filters;
    const { EtherSent } = activePool.filters;

    const userDepositChanged = UserDepositChanged(address);
    const etherSent = EtherSent();

    const depositListener = debounce((blockTag) => {
      this._readable
        .getStabilityDeposit(address, { blockTag })
        .then(onStabilityDepositChanged);
    });

    const etherSentListener = (toAddress, _amount, event) => {
      if (toAddress === stabilityPool.address) {
        // Liquidation while Stability Pool has some deposits
        // There may be new gains
        depositListener(event);
      }
    };

    stabilityPool.on(userDepositChanged, depositListener);
    activePool.on(etherSent, etherSentListener);

    return () => {
      stabilityPool.removeListener(userDepositChanged, depositListener);
      activePool.removeListener(etherSent, etherSentListener);
    };
  }

  watchRUSDInStabilityPool(onRUSDInStabilityPoolChanged) {
    const { rusdToken, stabilityPool } = _getContracts(
      this._readable.connection
    );
    const { Transfer } = rusdToken.filters;

    const transferRUSDFromStabilityPool = Transfer(stabilityPool.address);
    const transferRUSDToStabilityPool = Transfer(null, stabilityPool.address);

    const stabilityPoolRUSDFilters = [
      transferRUSDFromStabilityPool,
      transferRUSDToStabilityPool,
    ];

    const stabilityPoolRUSDListener = debounce((blockTag) => {
      this._readable
        .getRUSDInStabilityPool({ blockTag })
        .then(onRUSDInStabilityPoolChanged);
    });

    stabilityPoolRUSDFilters.forEach((filter) =>
      rusdToken.on(filter, stabilityPoolRUSDListener)
    );

    return () =>
      stabilityPoolRUSDFilters.forEach((filter) =>
        rusdToken.removeListener(filter, stabilityPoolRUSDListener)
      );
  }

  watchRUSDBalance(onRUSDBalanceChanged, address) {
    address ??= _requireAddress(this._readable.connection);

    const { rusdToken } = _getContracts(this._readable.connection);
    const { Transfer } = rusdToken.filters;
    const transferRUSDFromUser = Transfer(address);
    const transferRUSDToUser = Transfer(null, address);

    const rusdTransferFilters = [transferRUSDFromUser, transferRUSDToUser];

    const rusdTransferListener = debounce((blockTag) => {
      this._readable
        .getRUSDBalance(address, { blockTag })
        .then(onRUSDBalanceChanged);
    });

    rusdTransferFilters.forEach((filter) =>
      rusdToken.on(filter, rusdTransferListener)
    );

    return () =>
      rusdTransferFilters.forEach((filter) =>
        rusdToken.removeListener(filter, rusdTransferListener)
      );
  }
}
