module africa_railways::governance {
    use sui::object::{Self, UID};
    struct Proposal has key, store { id: UID, votes_yes: u64, is_active: bool }
}
