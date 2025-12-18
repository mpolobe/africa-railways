module spine_token::afrc {
    use sui::coin::{Self, TreasuryCap};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    struct AFRC has drop {}

    fun init(witness: AFRC, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness, 6, b"AFRC", b"Africoin", b"Digital Spine Utility Token", std::option::none(), ctx
        );
        transfer::public_freeze_object(metadata);
        transfer::public_share_object(treasury);
    }
}
