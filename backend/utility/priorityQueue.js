// Nodejs 공식문서 Priorityqueue 참조 및 조금변형
export class PriorityQueue {
  #compare = (a, b) => a - b;
  #heap = new Array();
  #size = 0;

  constructor() {}

  //노드 삽입
  insert(value) {
    const heap = this.#heap;
    const pos = ++this.#size;
    heap[pos] = value; // 값은 인덱스 1위치부터 들어감.

    const returnPos = this.percolateUp(pos);
    return returnPos;
  }

  // 부모노드와 비교 및 위로 정렬
  percolateUp(pos) {
    const heap = this.#heap;
    const compare = this.#compare;
    const item = heap[pos];

    while (pos > 1) {
      const parent = Math.floor(pos / 2);
      const parentItem = heap[parent];
      if (compare(parentItem.enterTime, item.enterTime) <= 0) break;

      heap[pos] = parentItem;
      pos = parent;
    }

    heap[pos] = item;
    console.log("percolateUp heap", heap);
    console.log("percolate pos", pos);
    return pos;
  }
  // 노드삭제
  removeAt(pos) {
    const heap = this.#heap;
    let size = this.#size;
    console.log("removeat에서 heap", heap);
    console.log("Removeat에서 pos", pos);
    console.log("RemoveAt에서 size", size);
    if (pos > size || pos < 1) {
      throw new Error("유효하지 않은 pos값.");
    }
    if (pos !== size) {
      // 인덱스 pos를 지우는 과정.
      heap[pos] = heap[size];
    }
    heap.splice(pos, 1);
    console.log("현재 heap", heap);
    size = --this.#size;
    if (size > 0 && pos <= size) {
      console.log("여기 실행됨");
      if (
        pos > 1 &&
        this.#compare(
          heap[Math.floor(pos / 2)].enterTime,
          heap[pos].enterTime
        ) > 0
      ) {
        return this.percolateUp(pos);
      } else {
        return this.percolateDown(pos);
      }
    } else {
      return undefined;
    }
  }
  // 자식노드와 비교 및 밑으로 정렬
  percolateDown(pos) {
    const compare = this.#compare;
    const heap = this.#heap;
    const size = this.#size;
    const parentMaxSize = Math.floor(size / 2); // 부모노드 인덱스의 최대
    const item = heap[pos];

    while (pos <= parentMaxSize) {
      let leftChild = pos * 2;
      const rightChild = leftChild + 1;
      let leftChildItem = heap[leftChild];

      if (
        rightChild <= size &&
        compare(heap[rightChild].enterTime, leftChildItem.enterTime) < 0
      ) {
        // 오른쪽자식노드가 존재하고, 오른쪽자식이 왼쪽자식보다 작으면 오른쪽자식 선택해서 비교
        leftChild = rightChild;
        leftChildItem = heap[rightChild];
      }

      if (compare(item.enterTime, leftChildItem.enterTime) <= 0) break;
      // 자식을 부모자리로 올리고
      heap[pos] = leftChildItem;
      // 자식위치로 옮김
      pos = leftChild;
    }

    heap[pos] = item;
    return pos;
  }

  shift(pos) {
    const heap = this.#heap;
    const value = heap[pos];
    if (value === undefined) {
      return;
    }

    this.removeAt(pos);

    return value;
  }

  peek(pos) {
    return this.#heap[pos];
  }

  peekBottom() {
    return this.#heap[this.#size];
  }

  peekAll() {
    return this.#heap;
  }
}
