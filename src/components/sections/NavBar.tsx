import { Link, useLocation } from "react-router";
import ImportBtn from "../atoms/ImportBtn";

export default function NavBar() {
	const location = useLocation();

	const isActive = (path: string) => {
		return location.pathname === path;
	};

	return (
		<nav className="bg-gray-800 text-white p-4">
			<div className="container mx-auto flex items-center justify-between">
				<div className="flex items-center space-x-8">
					<Link to="/" className="text-2xl font-bold hover:text-gray-300 transition-colors">
						Audo
					</Link>
					<div className="flex space-x-6">
						<Link
							to="/library"
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								isActive("/library") 
									? "bg-gray-900 text-white" 
									: "text-gray-300 hover:bg-gray-700 hover:text-white"
							}`}
						>
							Library
						</Link>
						<Link
							to="/now-playing"
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								isActive("/now-playing")
									? "bg-gray-900 text-white"
									: "text-gray-300 hover:bg-gray-700 hover:text-white"
							}`}
						>
							Now Playing
						</Link>
						<Link
							to="/favorites"
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								isActive("/favorites")
									? "bg-gray-900 text-white"
									: "text-gray-300 hover:bg-gray-700 hover:text-white"
							}`}
						>
							Favorites
						</Link>
					</div>
				</div>
				<ImportBtn /> 
			</div>
		</nav>
	);
}
