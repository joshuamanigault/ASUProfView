// Node class for doubly linked list
class Node {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null; 
    }
}

// LRU Cache class
export default class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = new Map();
        this.head = new Node(-1, -1); // Dummy head
        this.tail = new Node(-1, -1); // Dummy tail
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    // Add node right after the head (most recently used)
    add(node) {
        const nextNode = this.head.next;
        this.head.next = node;
        node.prev = this.head;
        node.next = nextNode;
        nextNode.prev = node;
    }

    // Remove a node from the doubly linked list
    remove(node) {
        const prevNode = node.prev;
        const nextNode = node.next;
        prevNode.next = nextNode;
        nextNode.prev = prevNode;
    }

    // Get the value of the key if the key exists in the cache, otherwise return -1
    get(key) {
        if (!this.cache.has(key)) {
            return -1;
        }

        const node = this.cache.get(key);
        this.remove(node);
        this.add(node);
        return node.value;
    }

    // Put a key-value pair into the cache
    put(key, value) {
        if (this.cache.has(key)) {
            const node = this.cache.get(key);
            this.remove(node);
            this.cache.delete(key);
        }

        if (this.cache.size >= this.capacity) {
            console.debug('Cache full, evicting least recently used item:', this.tail.prev.key);
            const lruNode = this.tail.prev;
            this.remove(lruNode);
            this.cache.delete(lruNode.key);
        }
        
        const newNode = new Node(key, value);
        this.add(newNode);
        this.cache.set(key, newNode);
    }

    // Clear the entire cache
    clear() {
        this.cache = new Map();
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
}