<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function search(Request $request)
    {
        $name = $request->input('name');
        $users = DB::select("SELECT * FROM users WHERE name = '$name'"); // @expect CWE-89
        $sorted = User::query()->orderByRaw($request->query('sort'))->get(); // @expect CWE-89
        $safe = DB::select('SELECT * FROM users WHERE name = ?', [$name]);
        return view('users.index', ['users' => $users, 'safe' => $safe, 'sorted' => $sorted]);
    }

    public function store(Request $request)
    {
        $user = User::create($request->all()); // @expect CWE-915
        return redirect($request->input('next')); // @expect CWE-601
    }
}
