import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts'
import { assert, beforeEach, clearStore, newMockEvent, test } from 'matchstick-as/assembly/index'
import { EscrowCollected } from '../src/types/PaymentsEscrow/PaymentsEscrow'
import { createOrLoadEscrowAccount, handleEscrowCollected } from '../src/mappings/paymentsEscrow'

const PAYER = Address.fromString('0x0000000000000000000000000000000000000011')
const COLLECTOR = Address.fromString('0x0000000000000000000000000000000000000012')
const RECEIVER = Address.fromString('0x0000000000000000000000000000000000000013')
const ID = PAYER.concat(COLLECTOR).concat(RECEIVER).toHexString()

beforeEach(() => {
  clearStore()
  let escrow = createOrLoadEscrowAccount(PAYER, COLLECTOR, RECEIVER)
  escrow.balance = BigInt.fromI32(100)
  escrow.totalAmountThawing = BigInt.fromI32(60)
  escrow.thawEndTimestamp = BigInt.fromI32(1234)
  escrow.save()
})

function collect(tokens: i32): void {
  let event = changetype<EscrowCollected>(newMockEvent())
  event.parameters = [
    new ethereum.EventParam('paymentType', ethereum.Value.fromI32(0)),
    new ethereum.EventParam('payer', ethereum.Value.fromAddress(PAYER)),
    new ethereum.EventParam('collector', ethereum.Value.fromAddress(COLLECTOR)),
    new ethereum.EventParam('receiver', ethereum.Value.fromAddress(RECEIVER)),
    new ethereum.EventParam('tokens', ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(tokens))),
  ]
  handleEscrowCollected(event)
}

test('collection caps thawing at the remaining balance without changing the deadline', () => {
  collect(70)
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'balance', '30')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'totalAmountThawing', '30')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'thawEndTimestamp', '1234')
})

test('collection clears thawing and the deadline when the balance is exhausted', () => {
  collect(100)
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'balance', '0')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'totalAmountThawing', '0')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'thawEndTimestamp', '0')
})

test('collection preserves thawing below and at the remaining balance', () => {
  collect(20)
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'balance', '80')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'totalAmountThawing', '60')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'thawEndTimestamp', '1234')
  collect(20)
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'balance', '60')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'totalAmountThawing', '60')
  assert.fieldEquals('PaymentsEscrowAccount', ID, 'thawEndTimestamp', '1234')
})
