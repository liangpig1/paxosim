MinHeapTest = TestCase("MinHeapTest");

MinHeapTest.prototype.testInitial = function() {
	var heapq = new MinHeap();
	heapq.push(5);
	assertEquals(5, heapq.pop());
	// jstestdriver.console.log("JsTestDriver", greeter.greet("World"));
	// console.log(greeter.greet("Browser", "World"));
};
MinHeapTest.prototype.testPopEmpty = function() {
	var heapq = new MinHeap();
	heapq.push(5);
	assertEquals(5, heapq.pop());
	assertEquals(null, heapq.pop());
};

MinHeapTest.prototype.testMinQueue = function() {
	var heapq = new MinHeap();
	heapq.push(5);
	heapq.push(1);
	heapq.push(3);
	heapq.push(9);
	assertEquals(1, heapq.pop());
	assertEquals(3, heapq.pop());
	assertEquals(5, heapq.pop());
	assertEquals(9, heapq.pop());
	assertEquals(null, heapq.pop());
};

MinHeapTest.prototype.testMinQueueMix = function() {
	var heapq = new MinHeap();
	heapq.push(5);
	assertEquals(5, heapq.getMin());
	heapq.push(2);
	assertEquals(2, heapq.getMin());
	heapq.push(1);
	assertEquals(1, heapq.getMin());
	assertEquals(1, heapq.pop());
	assertEquals(2, heapq.pop());
	assertEquals(5, heapq.getMin());
	heapq.push(3);
	assertEquals(3, heapq.getMin());
	heapq.push(9);
	assertEquals(3, heapq.pop());
	assertEquals(5, heapq.pop());
	assertEquals(9, heapq.pop());
	assertEquals(null, heapq.pop());
};

MinHeapTest.prototype.testInitialHeapify = function() {
	var array = [ 3, 2, 1, 5, 7, 9 ];
	var heapq = new MinHeap(array);
	assertEquals(1, heapq.pop());
	assertEquals(2, heapq.pop());
	assertEquals(3, heapq.pop());
	assertEquals(5, heapq.pop());
	assertEquals(7, heapq.pop());
	assertEquals(9, heapq.pop());
	assertEquals(null, heapq.pop());
};
MinHeapTest.prototype.testHeapArrays = function() {
	var array = new Array([ 1, 2, 1 ], [ 2, 1, 1 ], [ 1, 1, 1 ], [ 3, 2, 1 ], [
			5, 7, 9 ]);
	var heapq = new MinHeap(array);
	assertEquals([ 1, 1, 1 ], heapq.pop());
	assertEquals([ 1, 2, 1 ], heapq.pop());
	assertEquals([ 2, 1, 1 ], heapq.pop());
	assertEquals([ 3, 2, 1 ], heapq.pop());
	assertEquals([ 5, 7, 9 ], heapq.pop());
	assertEquals(null, heapq.pop());
};

MinHeapTest.prototype.testHeapComparator = function() {
	var heapq = new MinHeap(null, function(item1, item2) {
		return item1.k1 == item2.k1 ? 0 : item1.k1 < item2.k1 ? -1 : 1;
	});
	var val1 = {
		f1 : "testx1",
		k1 : "key1"
	};
	var val2 = {
		f1 : "testb2",
		k1 : "key2"
	};
	var val3 = {
		f1 : "testc3",
		k1 : "key3"
	};
	heapq.push(val1);
	heapq.push(val3);
	heapq.push(val2);
	assertEquals(val1, heapq.pop());
	assertEquals(val2, heapq.pop());
	assertEquals(val3, heapq.pop());
	assertEquals(null, heapq.pop());
};

MinHeapTest.prototype.testHeapArrayAndComparator = function() {
	var array = new Array();
	var val1 = {
		f1 : "testx1",
		k1 : "key1"
	};
	var val2 = {
		f1 : "testb2",
		k1 : "key2"
	};
	var val3 = {
		f1 : "testc3",
		k1 : "key3"
	};
	var val4 = {
		f1 : "testa4",
		k1 : "key4"
	};
	array.push(val1);
	array.push(val3);
	array.push(val4);
	array.push(val2);
	var heapq = new MinHeap(array, function(item1, item2) {
		return item1.k1 == item2.k1 ? 0 : item1.k1 < item2.k1 ? -1 : 1;
	});
	assertEquals(val1, heapq.pop());
	assertEquals(val2, heapq.pop());
	assertEquals(val3, heapq.pop());
	assertEquals(val4, heapq.pop());
	assertEquals(null, heapq.pop());
};

MinHeapTest.prototype.testInsertAndRemove = function() {
	var heapq = new MinHeap();
	heapq.insert(5);
	heapq.insert(1);
	heapq.insert(3);
	heapq.insert(9);
	assertEquals(1, heapq.remove());
	assertEquals(3, heapq.remove());
	assertEquals(5, heapq.remove());
	assertEquals(9, heapq.remove());
	assertEquals(null, heapq.remove());
};
