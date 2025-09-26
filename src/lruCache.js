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
        this.map = new Map();
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
}