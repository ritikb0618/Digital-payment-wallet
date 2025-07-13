
import PrivateRoute from './pages/PrivateRoute';
import { AuthProvider,useAuth } from './context/authContext';
import SignUp from './pages/Signup'
import SignIn from './pages/Signin'
import DashBoard from './pages/DashBoard'
import SendMoney from './pages/SendMoney'
import Settings from './pages/Settings'
import Transactions from './pages/Transactions'
import NotFound from './pages/NotFound'
import {RecoilRoot}  from 'recoil';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
// import Router from 'router';

function App() {
    const { authenticated } = useAuth();

    return (
        <>
            <RecoilRoot>
				{' '}
				<AuthProvider>
					<BrowserRouter>
						<Routes>
							<Route
								path='/signup'
								element={
									authenticated ? <Navigate to='/dashboard' /> : <SignUp />
								}
							/>
							<Route
								path='/signin'
								element={
									authenticated ? <Navigate to='/dashboard' /> : <SignIn />
								}
							/>

							{/* Private routes */}
							<Route
								path='/dashboard'
								element={
									<PrivateRoute>
										<DashBoard />
									</PrivateRoute>
								}
							/>
							<Route
								path='/send'
								element={
									<PrivateRoute>
										<SendMoney />
									</PrivateRoute>
								}
							/>
							<Route
								path='/settings'
								element={
									<PrivateRoute>
										<Settings />
									</PrivateRoute>
								}
							/>
							<Route
								path='/transactions'
								element={
									<PrivateRoute>
										<Transactions />
									</PrivateRoute>
								}
							/>
							<Route
								path='/'
								element={<Navigate to='/dashboard' />}
							/>
							<Route
								path='*'
								element={<NotFound />}
							/>
						</Routes>
					</BrowserRouter>
				</AuthProvider>
			</RecoilRoot>
		</>
    )
}
export default App;