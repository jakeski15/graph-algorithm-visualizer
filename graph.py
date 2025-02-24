from collections import deque
import heapq

class graph:
    def __init__(self, adj):
        #adj list defined as vertex i has adjacencies adj[i]
        self.adjacencies = [[] for _ in range(len(adj))]
        self.n = len(adj)
        self.edges_map = {}
        make_adj = []
        for u in range(len(adj)):
            for v in adj[u]:
                make_adj.append((u,v,0))
        self.add_adjacencies(make_adj)

        print(adj)
        print(self.adjacencies)
    
    def __str__(self):
        return str(self.adjacencies)

    def add_vertex(self):
        self.adjacencies.append([])
        self.n += 1

    #new_adj is a list of adjacencies in the form (v1, v2) where v1 -> v2
    def add_adjacencies(self, new_adj):
        for u,v,w in new_adj:
            uv_pos = len(self.adjacencies[u])
            vu_pos = len(self.adjacencies[v])
            if (u,v) not in self.edges_map:
                self.adjacencies[u].append((v,w))
                self.adjacencies[v].append((u,w))
                self.edges_map[(u,v)] = uv_pos
                self.edges_map[(v,u)] = vu_pos
            else:
                self.adjacencies[u][self.edges_map[(u,v)]] = (v,w)
                self.adjacencies[v][self.edges_map[(v,u)]] = (u,w)
            
            

    def bfs(self, start):
        queue = deque([start])
        visited = set([start])  # Ensure start node is marked visited
        traversal_order = []  # List to store BFS order

        while queue:
            curr = queue.popleft()
            traversal_order.append(curr)  # Store node in order list

            for v,_ in self.adjacencies[curr]:
                if v not in visited:
                    queue.append(v)
                    visited.add(v)
        return traversal_order  # Return traversal order for visualization
    def dfs(self, start, visited=None):
        if visited is None:
            visited = set()
        traversal_order = []

        def dfs_helper(node):
            visited.add(node)
            traversal_order.append(node)  # Store node in order list
            for neighbor, _ in self.adjacencies[node]:
                if neighbor not in visited:
                    dfs_helper(neighbor)

        dfs_helper(start)
        return traversal_order  # Return traversal order for visualization

    def dijkstra(self, start):
        # Initialize distances and paths
        distances = [float('inf')] * self.n
        distances[start] = 0
        previous = [None] * self.n
        pq = [(0, start)]  # Priority queue: (distance, node)
        traversal_order = []
        while pq:
            current_distance, current_node = heapq.heappop(pq)
            traversal_order.append(current_node)
            # If we've found a longer path, skip
            if current_distance > distances[current_node]:
                continue

            # Check all neighbors
            for neighbor, weight in self.adjacencies[current_node]:
                distance = current_distance + weight

                if distance < distances[neighbor]:
                    distances[neighbor] = distance
                    previous[neighbor] = current_node
                    heapq.heappush(pq, (distance, neighbor))
        print(traversal_order)
        return traversal_order # Reverse to show order from start outward
    
    def mst(self):
        #start is always going to be zero pretty much
        all_adj = set()
        for u in range(self.n):
            for v,w in self.adjacencies[u]:
                if not ((u,v,w) in all_adj or (v,u,w) in all_adj):
                    all_adj.add((u,v,w))
        all_adj = list(all_adj)
        all_adj = sorted(all_adj, key=lambda x:x[2])
        s = set([0])
        t = set([i for i in range(1,self.n)])
        ans = []
        while len(s) < self.n:
            for u,v,w in all_adj:
                if u in s and v in t:
                    ans.append([u,v])
                    t.remove(v)
                    s.add(v)
        print("mst ans:")
        print(ans)
        return ans
