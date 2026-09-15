import { Address, BigInt, ByteArray, Bytes, crypto, ethereum } from '@graphprotocol/graph-ts'
import {
  assert,
  beforeEach,
  clearStore,
  createMockedFunction,
  newMockEvent,
  test,
} from 'matchstick-as/assembly/index'
import { addresses } from '../config/addresses'
import { Allocation, GraphNetwork } from '../src/types/schema'
import {
  AllocationCreated,
  IndexingRewardsCollected,
  POIPresented,
} from '../src/types/SubgraphService/SubgraphService'
import { TargetAllocationUpdated } from '../src/types/IssuanceAllocator/IssuanceAllocator'
import { ParameterUpdated } from '../src/types/RewardsManager/RewardsManagerStitched'
import { createOrLoadGraphNetwork, createOrLoadIndexer } from '../src/mappings/helpers/helpers'
import {
  handleAllocationCreated,
  handleIndexingRewardsCollected,
  handlePOIPresented,
} from '../src/mappings/subgraphService'
import { handleTargetAllocationUpdated } from '../src/mappings/issuanceAllocator'
import { handleParameterUpdated } from '../src/mappings/rewardsManager'

const INDEXER = Address.fromString('0x0000000000000000000000000000000000000011')
const ALLOCATION = Address.fromString('0x0000000000000000000000000000000000000012')
const DEPLOYMENT = Bytes.fromHexString(
  '0x1111111111111111111111111111111111111111111111111111111111111111',
)
const POI = Bytes.fromHexString(
  '0x2222222222222222222222222222222222222222222222222222222222222222',
)
const ZERO = Bytes.fromHexString(
  '0x0000000000000000000000000000000000000000000000000000000000000000',
)
const LAUNCH = 1608163200

function param(name: string, value: ethereum.Value): ethereum.EventParam {
  return new ethereum.EventParam(name, value)
}

function uint(value: i32): ethereum.Value {
  return ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(value))
}

function baseEvent(): ethereum.Event {
  let event = newMockEvent()
  event.address = Address.fromString(addresses.subgraphService)
  event.block.number = BigInt.fromI32(20)
  event.block.timestamp = BigInt.fromI32(LAUNCH + 100)
  return event
}

function metadata(): Bytes {
  let tuple = new ethereum.Tuple()
  tuple.push(uint(123))
  tuple.push(ethereum.Value.fromFixedBytes(POI))
  tuple.push(uint(1))
  tuple.push(uint(0))
  tuple.push(uint(0))
  return ethereum.encode(ethereum.Value.fromTuple(tuple))!
}

function condition(label: string): Bytes {
  return Bytes.fromByteArray(crypto.keccak256(ByteArray.fromUTF8(label)))
}

function presented(raw: Bytes): POIPresented {
  let event = changetype<POIPresented>(baseEvent())
  event.logIndex = BigInt.fromI32(1)
  event.parameters = [
    param('indexer', ethereum.Value.fromAddress(INDEXER)),
    param('allocationId', ethereum.Value.fromAddress(ALLOCATION)),
    param('subgraphDeploymentId', ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    param('poi', ethereum.Value.fromFixedBytes(POI)),
    param('poiMetadata', ethereum.Value.fromBytes(metadata())),
    param('condition', ethereum.Value.fromFixedBytes(raw)),
  ]
  return event
}

function collected(): IndexingRewardsCollected {
  let event = changetype<IndexingRewardsCollected>(baseEvent())
  event.logIndex = BigInt.fromI32(2)
  event.parameters = [
    param('indexer', ethereum.Value.fromAddress(INDEXER)),
    param('allocationId', ethereum.Value.fromAddress(ALLOCATION)),
    param('subgraphDeploymentId', ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    param('tokensRewards', uint(100)),
    param('tokensIndexerRewards', uint(70)),
    param('tokensDelegationRewards', uint(30)),
    param('poi', ethereum.Value.fromFixedBytes(POI)),
    param('poiMetadata', ethereum.Value.fromBytes(metadata())),
    param('currentEpoch', uint(2)),
  ]
  return event
}

beforeEach(() => {
  clearStore()
  let controller = Address.fromString(addresses.controller)
  createMockedFunction(controller, 'getGovernor', 'getGovernor():(address)')
    .withArgs([])
    .returns([ethereum.Value.fromAddress(controller)])
  createMockedFunction(
    Address.fromString(addresses.epochManager),
    'blockNum',
    'blockNum():(uint256)',
  )
    .withArgs([])
    .returns([uint(20)])
  let network = createOrLoadGraphNetwork(BigInt.fromI32(20), controller)
  network.epochLength = 10
  network.lastLengthUpdateBlock = 0
  network.save()
  let indexer = createOrLoadIndexer(INDEXER, BigInt.fromI32(LAUNCH), network)
  indexer.save()
  let event = changetype<AllocationCreated>(baseEvent())
  event.parameters = [
    param('indexer', ethereum.Value.fromAddress(INDEXER)),
    param('allocationId', ethereum.Value.fromAddress(ALLOCATION)),
    param('subgraphDeploymentId', ethereum.Value.fromFixedBytes(DEPLOYMENT)),
    param('tokens', uint(1000)),
    param('currentEpoch', uint(2)),
  ]
  handleAllocationCreated(event)
})

test('Pre-upgrade rewards record a POI and update all reward snapshots', () => {
  handleIndexingRewardsCollected(collected())
  assert.fieldEquals('Allocation', ALLOCATION.toHexString(), 'poiCount', '1')
  let submission = collected().transaction.hash.toHexString() + '-2'
  assert.fieldEquals('PoiSubmission', submission, 'metadataDecoded', 'true')
  assert.fieldEquals('PoiSubmission', submission, 'blockNumber', '123')
  assert.assertNull(Allocation.load(ALLOCATION.toHexString())!.latestPoiCondition)
  assert.fieldEquals('GraphNetworkDailyData', '1-0', 'totalIndexingRewards', '100')
  assert.fieldEquals(
    'IndexerDailyData',
    INDEXER.toHexString() + '-0',
    'totalIndexingRewards',
    '100',
  )
  assert.fieldEquals(
    'ProvisionDailyData',
    INDEXER.toHexString() + '-' + addresses.subgraphService.toLowerCase() + '-0',
    'rewardsEarned',
    '100',
  )
  assert.fieldEquals(
    'SubgraphDeploymentDailyData',
    DEPLOYMENT.toHexString() + '-0',
    'indexingRewardAmount',
    '100',
  )
})

test('Post-upgrade presentations and rewards count each POI once and relay every non-deferred condition', () => {
  let raw = [ZERO, condition('STALE_POI'), condition('ZERO_POI'), condition('UNRECOGNIZED')]
  let decoded = ['None', 'StalePoi', 'ZeroPoi', 'Unknown']
  for (let i = 0; i < raw.length; i++) {
    let presentation = presented(raw[i])
    presentation.logIndex = BigInt.fromI32(i * 2 + 1)
    handlePOIPresented(presentation)
    let rewards = collected()
    rewards.logIndex = BigInt.fromI32(i * 2 + 2)
    handleIndexingRewardsCollected(rewards)
    let id = rewards.transaction.hash.toHexString() + '-' + rewards.logIndex.toString()
    assert.fieldEquals('PoiSubmission', id, 'condition', decoded[i])
    assert.fieldEquals('PoiSubmission', id, 'conditionRaw', raw[i].toHexString())
    assert.fieldEquals('Allocation', ALLOCATION.toHexString(), 'poiCount', (i + 1).toString())
  }
  assert.entityCount('PoiSubmission', 4)
  assert.fieldEquals('GraphNetworkDailyData', '1-0', 'totalIndexingRewards', '400')
})

test('Deferred POIs create submissions without rewards and refresh the network snapshot after epoch advancement', () => {
  let labels = ['ALLOCATION_TOO_YOUNG', 'SUBGRAPH_DENIED']
  let decoded = ['AllocationTooYoung', 'SubgraphDenied']
  for (let i = 0; i < labels.length; i++) {
    let event = presented(condition(labels[i]))
    event.logIndex = BigInt.fromI32(i + 1)
    event.block.number = BigInt.fromI32(30)
    event.block.timestamp = BigInt.fromI32(LAUNCH + 86400 + 100)
    createMockedFunction(
      Address.fromString(addresses.epochManager),
      'blockNum',
      'blockNum():(uint256)',
    )
      .withArgs([])
      .returns([uint(30)])
    handlePOIPresented(event)
    let id = event.transaction.hash.toHexString() + '-' + event.logIndex.toString()
    assert.fieldEquals('PoiSubmission', id, 'condition', decoded[i])
    assert.fieldEquals('PoiSubmission', id, 'submittedAtEpoch', '3')
  }
  assert.entityCount('PoiSubmission', 2)
  assert.fieldEquals('Allocation', ALLOCATION.toHexString(), 'poiCount', '2')
  assert.fieldEquals(
    'Allocation',
    ALLOCATION.toHexString(),
    'latestPoiPresentedAt',
    (LAUNCH + 86400 + 100).toString(),
  )
  assert.fieldEquals(
    'GraphNetworkDailyData',
    '1-1',
    'epochCount',
    GraphNetwork.load('1')!.epochCount.toString(),
  )
  assert.fieldEquals('GraphNetworkDailyData', '1-1', 'totalIndexingRewards', '0')
})

function allocationUpdated(target: Address, rate: i32, day: i32): TargetAllocationUpdated {
  let event = changetype<TargetAllocationUpdated>(baseEvent())
  event.address = Address.fromString(addresses.issuanceAllocator)
  event.block.timestamp = BigInt.fromI32(LAUNCH + day * 86400 + 100)
  event.parameters = [
    param('target', ethereum.Value.fromAddress(target)),
    param('newRate', uint(120)),
    param('newSelfMintingRate', uint(rate)),
  ]
  return event
}

test('Issuance allocation changes overwrite today, preserve yesterday, and ignore other targets', () => {
  let target = Address.fromString(addresses.rewardsManager)
  handleTargetAllocationUpdated(allocationUpdated(target, 96, 0))
  handleTargetAllocationUpdated(allocationUpdated(INDEXER, 999, 0))
  assert.fieldEquals('GraphNetwork', '1', 'networkGRTIssuancePerBlock', '96')
  assert.fieldEquals('GraphNetworkDailyData', '1-0', 'networkGRTIssuancePerBlock', '96')
  handleTargetAllocationUpdated(allocationUpdated(target, 90, 0))
  handleTargetAllocationUpdated(allocationUpdated(target, 80, 1))
  assert.fieldEquals('GraphNetworkDailyData', '1-0', 'networkGRTIssuancePerBlock', '90')
  assert.fieldEquals('GraphNetworkDailyData', '1-1', 'networkGRTIssuancePerBlock', '80')
  assert.fieldEquals('GraphNetwork', '1', 'networkGRTIssuancePerBlock', '80')
})

function issuanceParameter(): ParameterUpdated {
  let event = changetype<ParameterUpdated>(baseEvent())
  event.address = Address.fromString(addresses.rewardsManager)
  event.parameters = [param('param', ethereum.Value.fromString('issuancePerBlock'))]
  return event
}

test('RewardsManager parameter changes use allocated issuance and update the daily snapshot', () => {
  let event = issuanceParameter()
  createMockedFunction(
    event.address,
    'getAllocatedIssuancePerBlock',
    'getAllocatedIssuancePerBlock():(uint256)',
  )
    .withArgs([])
    .returns([uint(96)])
  createMockedFunction(event.address, 'issuancePerBlock', 'issuancePerBlock():(uint256)')
    .withArgs([])
    .returns([uint(120)])
  handleParameterUpdated(event)
  assert.fieldEquals('GraphNetwork', '1', 'networkGRTIssuancePerBlock', '96')
  assert.fieldEquals('GraphNetworkDailyData', '1-0', 'networkGRTIssuancePerBlock', '96')
})

test('RewardsManager falls back to legacy issuance before the allocator getter exists', () => {
  let event = issuanceParameter()
  createMockedFunction(
    event.address,
    'getAllocatedIssuancePerBlock',
    'getAllocatedIssuancePerBlock():(uint256)',
  )
    .withArgs([])
    .reverts()
  createMockedFunction(event.address, 'issuancePerBlock', 'issuancePerBlock():(uint256)')
    .withArgs([])
    .returns([uint(120)])
  handleParameterUpdated(event)
  assert.fieldEquals('GraphNetwork', '1', 'networkGRTIssuancePerBlock', '120')
  assert.fieldEquals('GraphNetworkDailyData', '1-0', 'networkGRTIssuancePerBlock', '120')
})
