from flask import Flask, request, render_template, jsonify
from graph import graph  # Assuming your graph class is in 'graph.py'

app = Flask(__name__)
stored_graph = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/clear_graph')
def clear_graph():
    global stored_graph
    stored_graph = None
    return jsonify({"message": "Graph cleared successfully!"})

@app.route('/submit_graph', methods=['POST'])
def submit_graph():
    global stored_graph
    data = request.get_json()
    graph_data = data.get('graph')
    adj_list = eval(graph_data)
    stored_graph = graph(adj_list)
    return jsonify({"message": "Graph received", "graph": stored_graph.adjacencies})

@app.route('/add_node_to_graph')
def add_node_to_graph():
    global stored_graph
    if not stored_graph:
        stored_graph = graph([[]])
    else:
        stored_graph.add_vertex()
    return jsonify({"message": "Node added to graph", "graph": stored_graph.adjacencies})

@app.route('/add_edge_to_graph', methods=['POST'])
def add_edge():
    global stored_graph
    nodes_as_json = request.get_json()
    from_vertex = nodes_as_json.get('ef')
    to_vertex = nodes_as_json.get('et')
    weight = nodes_as_json.get('weight')
    if not weight:
        weight = 0
    if not from_vertex:
        return jsonify({"message": "edge input missing from_vertex"})
    if not to_vertex:
        return jsonify({"message": "edge input missing to_vertex"})
    to_vertex = int(to_vertex)
    from_vertex = int(from_vertex)
    if to_vertex < from_vertex:
        to_vertex,from_vertex = from_vertex, to_vertex
    weight = int(weight)

    if not stored_graph:
        return jsonify({"message": "Graph does not exist"})
    if from_vertex < stored_graph.n and to_vertex < stored_graph.n:
        stored_graph.add_adjacencies([(from_vertex, to_vertex, weight)])
        print(stored_graph.adjacencies)
    else:
        return jsonify({"message": "nodes in graph do not exist"})
    
    return jsonify({"message": "Node added to graph", "graph": stored_graph.adjacencies})

    

@app.route('/get_graph')
def get_graph():
    return jsonify({"message": "Graph received", "graph": stored_graph.adjacencies})

@app.route('/run_algorithm', methods=['POST'])
def run_algorithm():
    global stored_graph
    
    if not stored_graph:
        return jsonify({"error": "Graph not submitted yet"})
    
    data = request.get_json()  # Get the algorithm selection
    selected_algorithm = data.get('algorithm')
    
    if selected_algorithm == "bfs":
        result = stored_graph.bfs(0)  # Example: Running BFS starting at vertex 0
    elif selected_algorithm == "dfs":
        result = stored_graph.dfs(0)
    elif selected_algorithm == "dijkstra":
        result = stored_graph.dijkstra(0)
    else:
        result = {"message": "Unknown algorithm selected"}

    # Return the result as JSON
    return jsonify({"message": f"Algorithm {selected_algorithm} completed", "result": result})

@app.route('/run_mst')
def run_mst():
    global stored_graph
    if not stored_graph:
        return jsonify({"error": "Graph not submitted yet"})
    result = stored_graph.mst()
    print(result)
    return jsonify({"result": result})

if __name__ == '__main__':
    app.run(debug=True)
