// Nodejs 공식문서 Priorityqueue 참조 및 조금변형
export class Priorityqueue {
  #compare = (a, b) => a - b;
  #heap = new Array();
  #size = 0;

  constructor() {}

  //노드 삽입
  insert(value) {
    const heap = this.#heap;
    const pos = ++this.#size;
    heap[pos] = value;

    this.percolateUp(pos);
  }

  // 부모노드와 비교 및 위로 정렬
  percolateUp(pos) {
    const heap = this.#heap;
    const compare = this.#compare;
    const item = heap[pos];

    while (pos > 1) {
      const parent = Math.floor(pos / 2);
      const parentItem = heap[parent];
      if (compare(parentItem, item) <= 0) break;

      heap[pos] = parentItem;
      pos = parent;
    }

    heap[pos] = item;
  }
  // 노드삭제
  removeAt(pos) {
    const heap = this.#heap;
    let size = this.#size;
    if (pos > size || pos < 1) {
      throw new Error("유효하지 않은 pos값.");
    }
    heap[pos] = heap[size];
    heap[size] = undefined;
    size = --this.#size;

    if (size > 0 && pos <= size) {
      if (pos > 1 && this.#compare(heap[Math.floor(pos / 2)], heap[pos]) > 0) {
        this.percolateUp(pos);
      } else {
        this.percolateDown(pos);
      }
    }
  }
  // 자식노드와 비교 및 밑으로 정렬
  percolateDawn(pos) {
    const compare = this.#compare;
    const heap = this.#heap;
    const size = this.#size;
    const parentMaxSize = Math.floor(size / 2); // 부모노드 인덱스의 최대
    const item = heap[pos];

    while (pos <= parentMaxSize) {
      let leftChild = pos * 2;
      const rightChild = leftChild + 1;
      let leftChildItem = heap[leftChild];

      if (rightChild <= size && compare(heap[rightChild], leftChildItem) < 0) {
        // 오른쪽자식노드가 존재하고, 오른쪽자식이 왼쪽자식보다 작으면 오른쪽자식 선택해서 비교
        leftChild = rightChild;
        leftChildItem = heap[rightChild];
      }

      if (compare(item, leftChildItem) <= 0) break;
      // 자식을 부모자리로 올리고
      heap[pos] = leftChildItem;
      // 자식위치로 옮김
      pos = leftChild;
    }

    heap[pos] = item;
  }

  shift() {
    const heap = this.#heap;
    const value = heap[1];
    if (value === undefined) {
      return;
    }

    this.removeAt(1);

    return value;
  }

  peek() {
    return this.#heap[1];
  }

  peekBottom() {
    return this.#heap[this.#size];
  }
}
