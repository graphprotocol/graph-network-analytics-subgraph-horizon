import { BigInt, BigDecimal } from '@graphprotocol/graph-ts'
import {
  GraphNetwork,
  GraphNetworkDailyData,
  Indexer,
  IndexerDailyData,
  Delegator,
  DelegatorDailyData,
  DelegatedStake,
  DelegatedStakeDailyData,
  SubgraphDeployment,
  SubgraphDeploymentDailyData,
  Provision,
  ProvisionDailyData,
  DataService,
  DataServiceDailyData,
} from '../../types/schema'
import { joinID } from './helpers'

const SECONDS_PER_DAY = 86400
const LAUNCH_DAY = 18613 // 1608163200 / 86400

const BIGINT_ZERO = BigInt.fromI32(0)
const BIGDECIMAL_ZERO = BigDecimal.fromString('0')

function dayStart(timestamp: BigInt): BigInt {
  let seconds = timestamp.toI32()
  return BigInt.fromI32((seconds / SECONDS_PER_DAY) * SECONDS_PER_DAY)
}

function dayEnd(start: BigInt): BigInt {
  return start.plus(BigInt.fromI32(SECONDS_PER_DAY))
}

function toDayNumber(timestamp: BigInt): i32 {
  return timestamp.toI32() / SECONDS_PER_DAY - LAUNCH_DAY
}

function dailyDataId(prefix: string, dayNumber: i32): string {
  return joinID([prefix, dayNumber.toString()])
}

export function getAndUpdateGraphNetworkDailyData(
  entity: GraphNetwork,
  timestamp: BigInt,
): GraphNetworkDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new GraphNetworkDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.network = entity.id

  dailyData.delegationRatio = entity.delegationRatio
  dailyData.totalTokensStaked = entity.totalTokensStaked
  dailyData.totalTokensClaimable = entity.totalTokensClaimable
  dailyData.totalUnstakedTokensLocked = entity.totalUnstakedTokensLocked
  dailyData.totalTokensProvisioned = entity.totalTokensProvisioned
  dailyData.totalTokensThawing = entity.totalTokensThawing
  dailyData.totalTokensAllocated = entity.totalTokensAllocated
  dailyData.totalDelegatedTokens = entity.totalDelegatedTokens
  dailyData.totalTokensStakedTransferredToL2 = entity.totalTokensStakedTransferredToL2
  dailyData.totalDelegatedTokensTransferredToL2 = entity.totalDelegatedTokensTransferredToL2
  dailyData.totalSignalledTokensTransferredToL2 = entity.totalSignalledTokensTransferredToL2

  dailyData.totalTokensSignalled = entity.totalTokensSignalled
  dailyData.totalTokensSignalledAutoMigrate = entity.totalTokensSignalledAutoMigrate
  dailyData.totalTokensSignalledDirectly = entity.totalTokensSignalledDirectly
  dailyData.defaultReserveRatio = entity.defaultReserveRatio

  dailyData.totalQueryFees = entity.totalQueryFees
  dailyData.totalIndexerQueryFeesCollected = entity.totalIndexerQueryFeesCollected
  dailyData.totalIndexerQueryFeeRebates = entity.totalIndexerQueryFeeRebates
  dailyData.totalDelegatorQueryFeeRebates = entity.totalDelegatorQueryFeeRebates
  dailyData.totalCuratorQueryFees = entity.totalCuratorQueryFees
  dailyData.totalTaxedQueryFees = entity.totalTaxedQueryFees
  dailyData.totalUnclaimedQueryFeeRebates = entity.totalUnclaimedQueryFeeRebates

  dailyData.totalIndexingRewards = entity.totalIndexingRewards
  dailyData.totalIndexingDelegatorRewards = entity.totalIndexingDelegatorRewards
  dailyData.totalIndexingIndexerRewards = entity.totalIndexingIndexerRewards

  dailyData.networkGRTIssuance = entity.networkGRTIssuance
  dailyData.networkGRTIssuancePerBlock = entity.networkGRTIssuancePerBlock

  dailyData.totalGRTMinted = entity.totalGRTMinted
  dailyData.totalGRTMintedFromL2 = entity.totalGRTMintedFromL2
  dailyData.totalGRTBurned = entity.totalGRTBurned
  dailyData.totalSupply = entity.totalSupply
  dailyData.GRTinUSD = entity.GRTinUSD
  dailyData.GRTinETH = entity.GRTinETH

  dailyData.totalGRTDeposited = entity.totalGRTDeposited
  dailyData.totalGRTDepositedConfirmed = entity.totalGRTDepositedConfirmed
  dailyData.totalGRTWithdrawn = entity.totalGRTWithdrawn
  dailyData.totalGRTWithdrawnConfirmed = entity.totalGRTWithdrawnConfirmed

  dailyData.indexerCount = entity.indexerCount
  dailyData.stakedIndexersCount = entity.stakedIndexersCount
  dailyData.delegatorCount = entity.delegatorCount
  dailyData.activeDelegatorCount = entity.activeDelegatorCount
  dailyData.delegationCount = entity.delegationCount
  dailyData.activeDelegationCount = entity.activeDelegationCount
  dailyData.curatorCount = entity.curatorCount
  dailyData.activeCuratorCount = entity.activeCuratorCount
  dailyData.subgraphCount = entity.subgraphCount
  dailyData.activeSubgraphCount = entity.activeSubgraphCount
  dailyData.subgraphDeploymentCount = entity.subgraphDeploymentCount
  dailyData.epochCount = entity.epochCount
  dailyData.allocationCount = entity.allocationCount
  dailyData.activeAllocationCount = entity.activeAllocationCount

  dailyData.save()

  return dailyData
}

export function getAndUpdateIndexerDailyData(
  entity: Indexer,
  timestamp: BigInt,
): IndexerDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new IndexerDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.indexer = entity.id

  dailyData.stakedTokens = entity.stakedTokens
  dailyData.provisionedTokens = entity.provisionedTokens
  dailyData.thawingTokens = entity.thawingTokens
  dailyData.allocatedTokens = entity.allocatedTokens
  dailyData.legacyAllocatedTokens = entity.legacyAllocatedTokens
  dailyData.lockedTokens = entity.lockedTokens
  dailyData.legacyLockedTokens = entity.legacyLockedTokens
  dailyData.unstakedTokens = entity.unstakedTokens
  dailyData.delegatedTokens = entity.delegatedTokens
  dailyData.delegatedThawingTokens = entity.delegatedThawingTokens
  dailyData.availableStake = entity.availableStake
  dailyData.delegatedCapacity = entity.delegatedCapacity
  dailyData.tokenCapacity = entity.tokenCapacity
  dailyData.delegatorShares = entity.delegatorShares
  dailyData.ownStakeRatio = entity.ownStakeRatio
  dailyData.delegatedStakeRatio = entity.delegatedStakeRatio
  dailyData.overDelegationDilution = entity.overDelegationDilution
  dailyData.delegationExchangeRate = entity.delegationExchangeRate
  dailyData.netDailyDelegatedTokens = BIGINT_ZERO

  dailyData.indexingRewardCut = entity.indexingRewardCut
  dailyData.legacyIndexingRewardCut = entity.legacyIndexingRewardCut
  dailyData.indexingRewardEffectiveCut = entity.indexingRewardEffectiveCut
  dailyData.legacyIndexingRewardEffectiveCut = entity.legacyIndexingRewardEffectiveCut
  dailyData.queryFeeCut = entity.queryFeeCut
  dailyData.legacyQueryFeeCut = entity.legacyQueryFeeCut
  dailyData.queryFeeEffectiveCut = entity.queryFeeEffectiveCut
  dailyData.legacyQueryFeeEffectiveCut = entity.legacyQueryFeeEffectiveCut
  dailyData.indexerRewardsOwnGenerationRatio = entity.indexerRewardsOwnGenerationRatio
  dailyData.legacyIndexerRewardsOwnGenerationRatio = entity.legacyIndexerRewardsOwnGenerationRatio
  dailyData.delegatorParameterCooldown = entity.delegatorParameterCooldown
  dailyData.lastDelegationParameterUpdate = entity.lastDelegationParameterUpdate
  dailyData.forcedClosures = entity.forcedClosures
  dailyData.stakedTokensTransferredToL2 = entity.stakedTokensTransferredToL2
  dailyData.thawingUntil = entity.thawingUntil

  dailyData.queryFeesCollected = entity.queryFeesCollected
  dailyData.queryFeeRebates = entity.queryFeeRebates
  dailyData.delegatorQueryFees = entity.delegatorQueryFees
  dailyData.totalIndexingRewards = entity.rewardsEarned
  dailyData.indexerIndexingRewards = entity.indexerIndexingRewards
  dailyData.delegatorIndexingRewards = entity.delegatorIndexingRewards
  dailyData.delegatorsCount = entity.delegatorsCount

  dailyData.save()

  return dailyData
}

export function getAndUpdateDelegatorDailyData(
  entity: Delegator,
  timestamp: BigInt,
): DelegatorDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new DelegatorDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.delegator = entity.id

  dailyData.stakedTokens = entity.stakedTokens
  dailyData.totalUnstakedTokens = entity.totalUnstakedTokens
  dailyData.lockedTokens = entity.lockedTokens
  dailyData.totalUnrealizedRewards = entity.totalUnrealizedRewards
  dailyData.totalRealizedRewards = entity.totalRealizedRewards
  dailyData.currentDelegation = entity.currentDelegation
  dailyData.stakesCount = entity.stakesCount
  dailyData.activeStakesCount = entity.activeStakesCount

  dailyData.save()

  return dailyData
}

export function getAndUpdateDelegatedStakeDailyData(
  entity: DelegatedStake,
  timestamp: BigInt,
): DelegatedStakeDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new DelegatedStakeDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.stake = entity.id
  dailyData.delegator = entity.delegator
  dailyData.indexer = entity.indexer
  dailyData.provision = entity.provision
  dailyData.dataService = entity.dataService
  dailyData.isLegacy = entity.isLegacy

  dailyData.delegatorDailyData = dailyDataId(entity.delegator, dayNumber)
  dailyData.indexerDailyData = dailyDataId(entity.indexer, dayNumber)
  if (entity.provision != null) {
    dailyData.provisionDailyData = dailyDataId(entity.provision!, dayNumber)
  }

  if (entity.dataService != null) {
    dailyData.dataServiceDailyData = dailyDataId(entity.dataService!, dayNumber)
  }

  dailyData.stakedTokens = entity.stakedTokens
  dailyData.unstakedTokens = entity.unstakedTokens
  dailyData.lockedTokens = entity.lockedTokens
  dailyData.legacyLockedTokens = entity.legacyLockedTokens
  dailyData.shareAmount = entity.shareAmount
  dailyData.personalExchangeRate = entity.personalExchangeRate
  dailyData.unrealizedRewards = entity.unrealizedRewards
  dailyData.realizedRewards = entity.realizedRewards
  dailyData.originalDelegation = entity.originalDelegation
  dailyData.currentDelegation = entity.currentDelegation
  dailyData.stakedTokensTransferredToL2 = entity.stakedTokensTransferredToL2
  dailyData.latestIndexerExchangeRate = entity.latestIndexerExchangeRate

  dailyData.save()

  return dailyData
}

export function getAndUpdateSubgraphDeploymentDailyData(
  entity: SubgraphDeployment,
  timestamp: BigInt,
): SubgraphDeploymentDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new SubgraphDeploymentDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.subgraphDeployment = entity.id

  dailyData.stakedTokens = entity.stakedTokens
  dailyData.signalledTokens = entity.signalledTokens
  dailyData.unsignalledTokens = entity.unsignalledTokens
  dailyData.signalAmount = entity.signalAmount
  dailyData.pricePerShare = entity.pricePerShare
  dailyData.signalledTokensReceivedOnL2 = entity.signalledTokensReceivedOnL2
  dailyData.signalledTokensSentToL2 = entity.signalledTokensSentToL2
  dailyData.subgraphCount = entity.subgraphCount
  dailyData.activeSubgraphCount = entity.activeSubgraphCount
  dailyData.deprecatedSubgraphCount = entity.deprecatedSubgraphCount

  dailyData.indexingRewardAmount = entity.indexingRewardAmount
  dailyData.indexingIndexerRewardAmount = entity.indexingIndexerRewardAmount
  dailyData.indexingDelegatorRewardAmount = entity.indexingDelegatorRewardAmount
  dailyData.queryFeesAmount = entity.queryFeesAmount
  dailyData.queryFeeRebates = entity.queryFeeRebates
  dailyData.delegatorQueryFees = entity.delegatorQueryFees
  dailyData.curatorFeeRewards = entity.curatorFeeRewards

  dailyData.save()

  return dailyData
}

export function getAndUpdateProvisionDailyData(
  entity: Provision,
  timestamp: BigInt,
): ProvisionDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new ProvisionDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.provision = entity.id
  dailyData.indexer = entity.indexer
  dailyData.dataService = entity.dataService

  dailyData.indexerDailyData = dailyDataId(entity.indexer, dayNumber)
  dailyData.dataServiceDailyData = dailyDataId(entity.dataService, dayNumber)

  dailyData.tokensProvisioned = entity.tokensProvisioned
  dailyData.tokensThawing = entity.tokensThawing
  dailyData.tokensAllocated = entity.tokensAllocated
  dailyData.delegatedTokens = entity.delegatedTokens
  dailyData.delegatedThawingTokens = entity.delegatedThawingTokens
  dailyData.delegatorShares = entity.delegatorShares
  dailyData.delegationExchangeRate = entity.delegationExchangeRate
  dailyData.ownStakeRatio = entity.ownStakeRatio
  dailyData.delegatedStakeRatio = entity.delegatedStakeRatio
  dailyData.indexerRewardsOwnGenerationRatio = entity.indexerRewardsOwnGenerationRatio
  dailyData.queryFeeEffectiveCut = entity.queryFeeEffectiveCut
  dailyData.indexingRewardEffectiveCut = entity.indexingRewardEffectiveCut
  dailyData.overDelegationDilution = entity.overDelegationDilution
  dailyData.allocationCount = entity.allocationCount
  dailyData.totalAllocationCount = entity.totalAllocationCount
  dailyData.tokensSlashedServiceProvider = entity.tokensSlashedServiceProvider
  dailyData.tokensSlashedDelegationPool = entity.tokensSlashedDelegationPool
  dailyData.queryFeesCollected = entity.queryFeesCollected
  dailyData.indexerQueryFees = entity.indexerQueryFees
  dailyData.delegatorQueryFees = entity.delegatorQueryFees
  dailyData.rewardsEarned = entity.rewardsEarned
  dailyData.indexerIndexingRewards = entity.indexerIndexingRewards
  dailyData.delegatorIndexingRewards = entity.delegatorIndexingRewards
  dailyData.queryFeeCut = entity.queryFeeCut
  dailyData.indexingFeeCut = entity.indexingFeeCut
  dailyData.indexingRewardsCut = entity.indexingRewardsCut
  dailyData.maxVerifierCut = entity.maxVerifierCut
  dailyData.maxVerifierCutPending = entity.maxVerifierCutPending
  dailyData.thawingPeriod = entity.thawingPeriod
  dailyData.thawingPeriodPending = entity.thawingPeriodPending
  dailyData.thawingUntil = entity.thawingUntil

  dailyData.save()

  return dailyData
}

export function getAndUpdateDataServiceDailyData(
  entity: DataService,
  timestamp: BigInt,
): DataServiceDailyData {
  let dayNumber = toDayNumber(timestamp)
  let id = dailyDataId(entity.id, dayNumber)

  let dailyData = new DataServiceDailyData(id)
  dailyData.dayStart = dayStart(timestamp)
  dailyData.dayEnd = dayEnd(dailyData.dayStart)
  dailyData.dayNumber = dayNumber
  dailyData.dataService = entity.id

  dailyData.totalTokensProvisioned = entity.totalTokensProvisioned
  dailyData.totalTokensThawing = entity.totalTokensThawing
  dailyData.totalTokensAllocated = entity.totalTokensAllocated
  dailyData.totalTokensDelegated = entity.totalTokensDelegated
  dailyData.minimumProvisionTokens = entity.minimumProvisionTokens
  dailyData.maximumProvisionTokens = entity.maximumProvisionTokens
  dailyData.minimumVerifierCut = entity.minimumVerifierCut
  dailyData.maximumVerifierCut = entity.maximumVerifierCut
  dailyData.minimumThawingPeriod = entity.minimumThawingPeriod
  dailyData.maximumThawingPeriod = entity.maximumThawingPeriod
  dailyData.delegationRatio = entity.delegationRatio
  dailyData.allowedWithTokenLockWallets = entity.allowedWithTokenLockWallets
  dailyData.curationCut = entity.curationCut
  dailyData.maxPOIStaleness = entity.maxPOIStaleness
  dailyData.stakeToFeesRatio = entity.stakeToFeesRatio

  dailyData.save()

  return dailyData
}
