#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Counter,
    LatestWriter,
    LastMessage,
}

#[contract]
pub struct Level2Soroban;

#[contractimpl]
impl Level2Soroban {
    pub fn initialize(env: Env) {
        env.storage().instance().set(&DataKey::Counter, &0u32);
        env.storage().instance().set(&DataKey::LatestWriter, &String::from_str(&env, ""));
        env.storage().instance().set(&DataKey::LastMessage, &String::from_str(&env, ""));
    }

    pub fn increment(env: Env, caller: Address) -> u32 {
        caller.require_auth();
        let next = Self::counter(env.clone()) + 1;
        env.storage().instance().set(&DataKey::Counter, &next);
        env.storage().instance().set(&DataKey::LatestWriter, &caller.to_string());
        env.events().publish(("counter", "incremented"), next);
        next
    }

    pub fn set_message(env: Env, caller: Address, message: String) -> String {
        caller.require_auth();
        env.storage().instance().set(&DataKey::LatestWriter, &caller.to_string());
        env.storage().instance().set(&DataKey::LastMessage, &message);
        env.events().publish(("message", "updated"), message.clone());
        message
    }

    pub fn get_state(env: Env) -> (u32, String, String) {
        (
            Self::counter(env.clone()),
            Self::latest_writer(env.clone()),
            Self::last_message(env),
        )
    }

    fn counter(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Counter).unwrap_or(0)
    }

    fn latest_writer(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::LatestWriter)
            .unwrap_or(String::from_str(&env, ""))
    }

    fn last_message(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::LastMessage)
            .unwrap_or(String::from_str(&env, ""))
    }
}

mod test;